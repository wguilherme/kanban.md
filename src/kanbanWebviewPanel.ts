import * as vscode from 'vscode';
import * as fs from 'fs';

import { MarkdownKanbanParser, KanbanBoard, KanbanTask, KanbanColumn } from './markdownParser';

/**
 * Creates a fingerprint of the board structure for content comparison.
 * This is the "NormalizedDocument" pattern used by vscode-drawio to prevent
 * unnecessary updates when content hasn't actually changed.
 */
function getBoardFingerprint(board: KanbanBoard): string {
    return board.columns
        .map(col => `${col.id}:${col.archived ? 'A' : ''}[${col.tasks.map(t => t.id).join(',')}]`)
        .join('|');
}

export class KanbanWebviewPanel {
    public static currentPanel: KanbanWebviewPanel | undefined;
    public static readonly viewType = 'markdownKanbanPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _board?: KanbanBoard;
    private _document?: vscode.TextDocument;

    // Flag to prevent external reload when we just saved from webview
    // This is the key to preventing flickering!
    private _isSavingFromWebview = false;

    // Track the last board fingerprint sent to webview
    // This prevents sending duplicate updates (NormalizedDocument pattern from vscode-drawio)
    private _lastSentFingerprint: string = '';

    // Track if HTML has been built (only rebuild on first load or revive)
    private _htmlBuilt = false;

    // Queue for serializing save operations to prevent race conditions
    // When dragging multiple cards quickly, saves must happen in order
    private _saveQueue: Promise<void> = Promise.resolve();

    // Counter to track pending operations (for extended save flag)
    private _pendingOperations = 0;

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext, document?: vscode.TextDocument) {
        const column = vscode.window.activeTextEditor?.viewColumn;

        if (KanbanWebviewPanel.currentPanel) {
            KanbanWebviewPanel.currentPanel._panel.reveal(column);
            if (document) {
                KanbanWebviewPanel.currentPanel.loadMarkdownFile(document);
            }
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            KanbanWebviewPanel.viewType,
            'Markdown Kanban',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist', 'webview')
                ],
                retainContextWhenHidden: true
            }
        );

        KanbanWebviewPanel.currentPanel = new KanbanWebviewPanel(panel, extensionUri, context);

        if (document) {
            KanbanWebviewPanel.currentPanel.loadMarkdownFile(document);
        }
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'dist', 'webview')
            ],
        };
        KanbanWebviewPanel.currentPanel = new KanbanWebviewPanel(panel, extensionUri, context);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, _context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();
        this._setupEventListeners();
        
        if (this._document) {
            this.loadMarkdownFile(this._document);
        }
    }

    private _setupEventListeners() {
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.onDidChangeViewState(
            e => {
                if (e.webviewPanel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );
    }

    private _handleMessage(message: any) {
        switch (message.type) {
            case 'webviewReady':
                // Webview is ready, send the board data (force to ensure initial load)
                this._sendBoardUpdate(true);
                break;
            case 'moveTask':
                this.moveTask(message.taskId, message.fromColumnId, message.toColumnId, message.newIndex);
                break;
            case 'updateTask':
                this.updateTask(message.taskId, message.updates);
                break;
            case 'addTask':
                this.addTask(message.columnId, message.taskData);
                break;
            case 'deleteTask':
                this.deleteTask(message.taskId, message.columnId);
                break;
            case 'editTask':
                this.editTask(message.taskId, message.columnId, message.taskData);
                break;
            case 'addColumn':
                this.addColumn(message.title);
                break;
            case 'moveColumn':
                this.moveColumn(message.fromIndex, message.toIndex);
                break;
            case 'toggleTask':
                this.toggleTaskExpansion(message.taskId);
                break;
            case 'updateTaskStep':
                this.updateTaskStep(message.taskId, message.columnId, message.stepIndex, message.completed);
                break;
            case 'reorderTaskSteps':
                this.reorderTaskSteps(message.taskId, message.columnId, message.newOrder);
                break;
            case 'toggleColumnArchive':
                this.toggleColumnArchive(message.columnId, message.archived);
                break;
        }
    }

    public loadMarkdownFile(document: vscode.TextDocument) {
        this._document = document;
        try {
            this._board = MarkdownKanbanParser.parseMarkdown(document.getText());
        } catch (error) {
            console.error('Error parsing Markdown:', error);
            vscode.window.showErrorMessage(`Kanban parsing error: ${error instanceof Error ? error.message : String(error)}`);
            this._board = { title: 'Error Loading Board', columns: [] };
        }
        this._update();
    }

    private _update() {
        if (!this._panel.webview) {return;}

        // Only build HTML once per panel lifecycle (NormalizedDocument pattern)
        // This prevents unnecessary DOM reconstruction which causes flickering
        if (!this._htmlBuilt) {
            this._panel.webview.html = this._getHtmlForWebview();
            this._htmlBuilt = true;
            // Send board data after a short delay to ensure webview is ready
            setTimeout(() => {
                this._sendBoardUpdate(true); // Force update on initial load
            }, 100);
        } else {
            // Just send the board data without rebuilding HTML
            this._sendBoardUpdate();
        }
    }

    /**
     * Send board update to webview, but only if content has actually changed.
     * This is the key optimization that prevents flickering - we compare
     * fingerprints before sending to avoid redundant updates.
     *
     * @param force - Force send even if fingerprint matches (for initial load)
     */
    private _sendBoardUpdate(force = false) {
        const board = this._board || { title: 'Please open a Markdown Kanban file', columns: [] };
        const fingerprint = getBoardFingerprint(board);

        // Skip if content hasn't changed (unless forced)
        if (!force && fingerprint === this._lastSentFingerprint) {
            return;
        }

        this._lastSentFingerprint = fingerprint;
        this._panel.webview.postMessage({
            type: 'updateBoard',
            board: board
        });
    }

    /**
     * Check if the panel is currently saving from webview action.
     * Used by external listeners to avoid reloading when we just saved.
     */
    public isSavingFromWebview(): boolean {
        return this._isSavingFromWebview;
    }

    private findColumn(columnId: string): KanbanColumn | undefined {
        return this._board?.columns.find(col => col.id === columnId);
    }

    private findTask(columnId: string, taskId: string): { column: KanbanColumn; task: KanbanTask; index: number } | undefined {
        const column = this.findColumn(columnId);
        if (!column) {return undefined;}

        const taskIndex = column.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {return undefined;}

        return {
            column,
            task: column.tasks[taskIndex],
            index: taskIndex
        };
    }

    /**
     * Performs an action and saves to markdown with proper queuing.
     * This ensures rapid sequential operations (like dragging multiple cards)
     * are processed in order without race conditions.
     */
    private performAction(action: () => void, skipUpdate = true) {
        if (!this._board) {return;}

        // Execute the action immediately (updates in-memory state)
        action();

        // Increment pending operations counter
        this._pendingOperations++;

        // Set flag immediately to block external reloads
        this._isSavingFromWebview = true;

        // Queue the save operation to prevent race conditions
        this._saveQueue = this._saveQueue.then(async () => {
            await this._doSave();

            this._pendingOperations--;

            // Only reset the save flag when ALL pending operations are done
            if (this._pendingOperations === 0) {
                // Small delay to ensure document change events have been processed
                setTimeout(() => {
                    if (this._pendingOperations === 0) {
                        this._isSavingFromWebview = false;
                    }
                }, 100);
            }
        }).catch(err => {
            console.error('Error saving to markdown:', err);
            this._pendingOperations--;
            if (this._pendingOperations === 0) {
                this._isSavingFromWebview = false;
            }
        });

        // Only update UI for operations not initiated by frontend
        // Frontend already has optimistic updates, so skip to avoid flash
        if (!skipUpdate) {
            this._update();
        }
    }

    /**
     * Internal save operation - separated from performAction for queuing
     */
    private async _doSave() {
        if (!this._document || !this._board) {return;}

        const config = vscode.workspace.getConfiguration('markdown-kanban');
        const taskHeaderFormat = config.get<'title' | 'list'>('taskHeader', 'title');

        const markdown = MarkdownKanbanParser.generateMarkdown(this._board, taskHeaderFormat);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            this._document.uri,
            new vscode.Range(0, 0, this._document.lineCount, 0),
            markdown
        );
        await vscode.workspace.applyEdit(edit);
        await this._document.save();
    }

    private moveTask(taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) {
        this.performAction(() => {
            const fromColumn = this.findColumn(fromColumnId);
            const toColumn = this.findColumn(toColumnId);

            if (!fromColumn || !toColumn) {return;}

            const taskIndex = fromColumn.tasks.findIndex(task => task.id === taskId);
            if (taskIndex === -1) {return;}

            const task = fromColumn.tasks.splice(taskIndex, 1)[0];
            toColumn.tasks.splice(newIndex, 0, task);
        });
    }

    private updateTask(taskId: string, updates: Partial<KanbanTask>) {
        this.performAction(() => {
            if (!this._board) {return;}

            // Find the task in any column
            for (const column of this._board.columns) {
                const taskIndex = column.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    // Update the task with partial updates
                    Object.assign(column.tasks[taskIndex], updates);
                    return;
                }
            }
        });
    }

    private addTask(columnId: string, taskData: any) {
        this.performAction(() => {
            const column = this.findColumn(columnId);
            if (!column) {return;}

            const newTask: KanbanTask = {
                id: Math.random().toString(36).substr(2, 9),
                title: taskData.title,
                description: taskData.description,
                tags: taskData.tags || [],
                priority: taskData.priority,
                workload: taskData.workload,
                dueDate: taskData.dueDate,
                defaultExpanded: taskData.defaultExpanded,
                steps: taskData.steps || []
            };

            column.tasks.push(newTask);
        });
    }

    private deleteTask(taskId: string, columnId: string) {
        this.performAction(() => {
            const column = this.findColumn(columnId);
            if (!column) {return;}

            const taskIndex = column.tasks.findIndex(task => task.id === taskId);
            if (taskIndex === -1) {return;}

            column.tasks.splice(taskIndex, 1);
        });
    }

    private editTask(taskId: string, columnId: string, taskData: any) {
        this.performAction(() => {
            const result = this.findTask(columnId, taskId);
            if (!result) {return;}

            Object.assign(result.task, {
                title: taskData.title,
                description: taskData.description,
                tags: taskData.tags || [],
                priority: taskData.priority,
                workload: taskData.workload,
                dueDate: taskData.dueDate,
                defaultExpanded: taskData.defaultExpanded,
                steps: taskData.steps || []
            });
        });
    }

    private updateTaskStep(taskId: string, columnId: string, stepIndex: number, completed: boolean) {
        this.performAction(() => {
            const result = this.findTask(columnId, taskId);
            if (!result?.task.steps || stepIndex < 0 || stepIndex >= result.task.steps.length) {
                return;
            }

            result.task.steps[stepIndex].completed = completed;
        });
    }

    private reorderTaskSteps(taskId: string, columnId: string, newOrder: number[]) {
        this.performAction(() => {
            const result = this.findTask(columnId, taskId);
            if (!result?.task.steps) {return;}

            const originalSteps = [...result.task.steps];
            const reorderedSteps = newOrder
                .filter(index => index >= 0 && index < originalSteps.length)
                .map(index => originalSteps[index]);

            result.task.steps = reorderedSteps;
        });
    }

    private addColumn(title: string) {
        this.performAction(() => {
            if (!this._board) {return;}

            const newColumn: KanbanColumn = {
                id: Math.random().toString(36).substr(2, 9),
                title: title,
                tasks: []
            };

            this._board.columns.push(newColumn);
        });
    }

    private moveColumn(fromIndex: number, toIndex: number) {
        this.performAction(() => {
            if (!this._board || fromIndex === toIndex) {return;}

            const columns = this._board.columns;
            const column = columns.splice(fromIndex, 1)[0];
            columns.splice(toIndex, 0, column);
        });
    }

    private toggleTaskExpansion(taskId: string) {
        this._panel.webview.postMessage({
            type: 'toggleTaskExpansion',
            taskId: taskId
        });
    }

    private toggleColumnArchive(columnId: string, archived: boolean) {
        this.performAction(() => {
            const column = this.findColumn(columnId);
            if (!column) {return;}

            column.archived = archived;
        });
    }

    private _getHtmlForWebview() {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

        const webviewUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview')
        );

        const cspSource = this._panel.webview.cspSource;
        const nonce = this._getNonce();

        // Replace placeholders
        html = html.replace(/{{cspSource}}/g, cspSource);
        html = html.replace(/{{nonce}}/g, nonce);

        // Fix asset paths - convert /assets/ to proper webview URIs
        html = html.replace(/src="\/assets\//g, `src="${webviewUri.toString()}/assets/`);
        html = html.replace(/href="\/assets\//g, `href="${webviewUri.toString()}/assets/`);

        // Add nonce to inline scripts
        html = html.replace(/<script/g, `<script nonce="${nonce}"`);

        return html;
    }

    private _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public dispose() {
        KanbanWebviewPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            disposable?.dispose();
        }
    }
}