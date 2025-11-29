// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { KanbanWebviewPanel } from './kanbanWebviewPanel';
import { KanbanTreeProvider } from './kanbanTreeProvider';
import { KANBAN_TEMPLATE } from './templates/kanbanTemplate';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let fileListenerEnabled = true;
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Markdown Kanban extension is now active!');

	// Register TreeView for sidebar
	const treeDataProvider = new KanbanTreeProvider();
	const treeView = vscode.window.createTreeView('markdown-kanban.boards', {
		treeDataProvider: treeDataProvider
	});

	// Register webview panel serializer (for restoring panel state)
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(KanbanWebviewPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
				KanbanWebviewPanel.revive(webviewPanel, context.extensionUri, context);
			}
		});
	}

	// Register open kanban command (opens in center area)
	const openKanbanCommand = vscode.commands.registerCommand('markdown-kanban.openKanban', async (uri?: vscode.Uri) => {
		let targetUri = uri;

		// If no URI provided, try to get from active editor
		if (!targetUri && vscode.window.activeTextEditor) {
			targetUri = vscode.window.activeTextEditor.document.uri;
		}

		// If still no URI, let user select file
		if (!targetUri) {
			const fileUris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: false,
				filters: {
					'Markdown files': ['md']
				}
			});

			if (fileUris && fileUris.length > 0) {
				targetUri = fileUris[0];
			} else {
				return;
			}
		}

		// Check if file is a markdown file
		if (!targetUri.fsPath.endsWith('.md')) {
			vscode.window.showErrorMessage('Please select a markdown file.');
			return;
		}

		try {
			// Open document
			const document = await vscode.workspace.openTextDocument(targetUri);

			// Create or show kanban panel in center area
			KanbanWebviewPanel.createOrShow(context.extensionUri, context, document);

			vscode.window.showInformationMessage(`load kanban from: ${document.fileName}`);
		} catch (error) {
			vscode.window.showErrorMessage(`failed open kanban: ${error}`);
		}
	});

	const disableFileListenerCommand = vscode.commands.registerCommand('markdown-kanban.disableFileListener', async () => {
		fileListenerEnabled = !fileListenerEnabled;
	});

	// Register refresh command for sidebar
	const refreshCommand = vscode.commands.registerCommand('markdown-kanban.refresh', () => {
		treeDataProvider.refresh();
	});

	// Register command to open kanban from sidebar
	const openFromSidebarCommand = vscode.commands.registerCommand('markdown-kanban.openFromSidebar', async (uri: vscode.Uri) => {
		const document = await vscode.workspace.openTextDocument(uri);
		KanbanWebviewPanel.createOrShow(context.extensionUri, context, document);
	});

	// Register command to edit markdown file directly
	const editMarkdownCommand = vscode.commands.registerCommand('markdown-kanban.editMarkdown', async (item: any) => {
		// item can be KanbanTreeItem (from context menu) or Uri (from other sources)
		const uri = item.resourceUri || item;
		const document = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(document);
	});

	// Register command to create new kanban board
	const newKanbanCommand = vscode.commands.registerCommand('markdown-kanban.newKanban', async () => {
		// Get workspace folder
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Please open a workspace folder first.');
			return;
		}

		// Ask user for file name
		const fileName = await vscode.window.showInputBox({
			prompt: 'Enter kanban board name',
			placeHolder: 'my-project',
			validateInput: (value) => {
				if (!value || value.trim().length === 0) {
					return 'File name cannot be empty';
				}
				if (value.includes('/') || value.includes('\\')) {
					return 'File name cannot contain path separators';
				}
				return null;
			}
		});

		if (!fileName) {
			return;
		}

		// Create file path
		const workspaceFolder = workspaceFolders[0];
		const sanitizedFileName = fileName.trim().replace(/\.kanban\.md$/, '').replace(/\.md$/, '');
		const filePath = path.join(workspaceFolder.uri.fsPath, `${sanitizedFileName}.kanban.md`);
		const fileUri = vscode.Uri.file(filePath);

		try {
			// Check if file already exists
			try {
				await vscode.workspace.fs.stat(fileUri);
				vscode.window.showErrorMessage(`File ${sanitizedFileName}.kanban.md already exists.`);
				return;
			} catch {
				// File doesn't exist, continue
			}

			// Create file with template
			const edit = new vscode.WorkspaceEdit();
			edit.createFile(fileUri, { ignoreIfExists: false });
			await vscode.workspace.applyEdit(edit);

			// Open and write template
			const document = await vscode.workspace.openTextDocument(fileUri);
			const editor = await vscode.window.showTextDocument(document);
			await editor.edit(editBuilder => {
				editBuilder.insert(new vscode.Position(0, 0), KANBAN_TEMPLATE);
			});

			// Save the document
			await document.save();

			// Open kanban board
			KanbanWebviewPanel.createOrShow(context.extensionUri, context, document);

			vscode.window.showInformationMessage(`Created ${sanitizedFileName}.kanban.md`);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create kanban board: ${error}`);
		}
	});

	// Listen for document changes, auto-update kanban (real-time sync)
	const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		if (event.document.languageId === 'markdown' && fileListenerEnabled) {
			// Delay update to avoid frequent refreshes
			setTimeout(() => {
				// Update kanban in panel
				if (KanbanWebviewPanel.currentPanel) {
					// IMPORTANT: Skip reload if the change was initiated by the webview itself
					// This prevents flickering when dragging tasks - the webview already has
					// the updated state from optimistic updates
					if (KanbanWebviewPanel.currentPanel.isSavingFromWebview()) {
						return;
					}
					KanbanWebviewPanel.currentPanel.loadMarkdownFile(event.document);
				}
			}, 500);
		}
	});

	// Listen for active editor changes
	const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor && editor.document.languageId === 'markdown' && fileListenerEnabled) {
			vscode.commands.executeCommand('setContext', 'markdownKanbanActive', true);
			// If panel is open, auto-load current document
			if (KanbanWebviewPanel.currentPanel) {
				KanbanWebviewPanel.currentPanel.loadMarkdownFile(editor.document);
			}
		} else {
			vscode.commands.executeCommand('setContext', 'markdownKanbanActive', false);
		}
	});

	// Add to subscriptions list
	context.subscriptions.push(
		treeView,
		openKanbanCommand,
		disableFileListenerCommand,
		refreshCommand,
		openFromSidebarCommand,
		editMarkdownCommand,
		newKanbanCommand,
		documentChangeListener,
		activeEditorChangeListener,
	);

	// If there's an active markdown editor, auto-activate kanban
	if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
		vscode.commands.executeCommand('setContext', 'markdownKanbanActive', true);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clear context
	vscode.commands.executeCommand('setContext', 'markdownKanbanActive', false);
}
