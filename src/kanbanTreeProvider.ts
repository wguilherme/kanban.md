import * as vscode from 'vscode';
import * as path from 'path';

export class KanbanTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly resourceUri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = resourceUri.fsPath;
        this.description = path.dirname(vscode.workspace.asRelativePath(resourceUri));
        this.resourceUri = resourceUri;
        this.contextValue = 'kanbanFile';
        this.iconPath = new vscode.ThemeIcon('markdown');
        this.command = {
            command: 'markdown-kanban.openFromSidebar',
            title: 'Open Kanban Board',
            arguments: [resourceUri]
        };
    }
}

export class KanbanTreeProvider implements vscode.TreeDataProvider<KanbanTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<KanbanTreeItem | undefined | null | void> = new vscode.EventEmitter<KanbanTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<KanbanTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {
        // Watch for .kanban.md file changes
        const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.kanban.md');
        fileWatcher.onDidCreate(() => this.refresh());
        fileWatcher.onDidDelete(() => this.refresh());
        fileWatcher.onDidChange(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: KanbanTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: KanbanTreeItem): Promise<KanbanTreeItem[]> {
        if (element) {
            return [];
        }

        // Find all .kanban.md files in workspace
        const files = await vscode.workspace.findFiles('**/*.kanban.md', '**/node_modules/**');

        // Map to tree items
        const items: KanbanTreeItem[] = files.map(uri => {
            const fileName = path.basename(uri.fsPath);
            return new KanbanTreeItem(
                fileName,
                uri,
                vscode.TreeItemCollapsibleState.None
            );
        });

        return items.sort((a, b) => a.label.localeCompare(b.label));
    }
}
