import * as vscode from 'vscode';
import { MatchProvider } from './matchProvider';

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly tooltip: string,
    public readonly range: vscode.Range
  ) {
    super(label, collapsibleState);
    this.command = {
      command: 'text-overview.revealMatch',
      title: '跳转到字符串位置',
      arguments: [range],
    };
  }
}

export class TreeProvider
  implements vscode.TreeDataProvider<TreeItem>, vscode.Disposable
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | null | void
  > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private matchProvider: MatchProvider;
  private disposables: vscode.Disposable[] = [];

  constructor(matchProvider: MatchProvider) {
    this.matchProvider = matchProvider;
    this.disposables.push(
      this.matchProvider.onMatchesChange(() => {
        this.refresh();
      })
    );
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }

  private refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem) {
    return element;
  }

  getChildren(element?: TreeItem) {
    if (element) {
      return [];
    }
    return this.matchProvider
      .getMatches()
      .map(
        (match) =>
          new TreeItem(
            `[${match.type}] "${match.content}"`,
            vscode.TreeItemCollapsibleState.None,
            '',
            match.range
          )
      );
  }
}
