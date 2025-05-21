import * as vscode from 'vscode';
import {
  GetTransMatcher,
  JsxMatcher,
  type Match,
  QuotedStringMatcher,
} from './matcher';

export class MatchProvider implements vscode.Disposable {
  private matchers = [
    new QuotedStringMatcher(),
    new JsxMatcher(),
    new GetTransMatcher(),
  ];
  private _onMatchesChange = new vscode.EventEmitter<Match[]>();
  private currentMatches: Match[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.updateMatches();
      }),
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document === vscode.window.activeTextEditor?.document) {
          this.updateMatches();
        }
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('text-overview.chineseOnly')) {
          this.updateMatches();
        }
      })
    );
    this.updateMatches();
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this._onMatchesChange.dispose();
  }

  public get onMatchesChange() {
    return this._onMatchesChange.event;
  }

  public getMatches() {
    return this.currentMatches;
  }

  private updateMatches() {
    if (!vscode.window.activeTextEditor) {
      this.currentMatches = [];
      this._onMatchesChange.fire(this.currentMatches);
      return;
    }

    const document = vscode.window.activeTextEditor.document;
    const chineseOnly = vscode.workspace
      .getConfiguration('text-overview')
      .get('chineseOnly', false as boolean);

    this.currentMatches = this.matchers
      .flatMap((matcher) => matcher.findMatches(document))
      .filter((match) => !chineseOnly || /[\u4e00-\u9fa5]/.test(match.content));

    this._onMatchesChange.fire(this.currentMatches);
  }
}
