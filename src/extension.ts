import * as vscode from 'vscode';
import { TreeProvider } from './tree';
import { DimProvider } from './dimProvider';
import { MatchProvider } from './matchProvider';

export function activate(context: vscode.ExtensionContext) {
  const matchProvider = new MatchProvider();
  const dimProvider = new DimProvider(matchProvider);

  const treeView = vscode.window.createTreeView('text-overview.tree', {
    treeDataProvider: new TreeProvider(matchProvider),
  });

  const toggleChineseOnlyCommand = vscode.commands.registerCommand(
    'text-overview.toggleChineseOnly',
    () => {
      const config = vscode.workspace.getConfiguration('text-overview');
      const currentValue = config.get('chineseOnly', false as boolean);
      config.update('chineseOnly', !currentValue, true);
    }
  );

  const toggleDimCommand = vscode.commands.registerCommand(
    'text-overview.toggleDimNonMatching',
    () => {
      const config = vscode.workspace.getConfiguration('text-overview');
      const currentValue = config.get('dimNonMatching', false as boolean);
      config.update('dimNonMatching', !currentValue, true);
    }
  );

  const revealMatchCommand = vscode.commands.registerCommand(
    'text-overview.revealMatch',
    (range: vscode.Range) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      }
    }
  );

  context.subscriptions.push(
    treeView,
    revealMatchCommand,
    toggleChineseOnlyCommand,
    toggleDimCommand,
    dimProvider,
    matchProvider
  );
}

export function deactivate() {}
