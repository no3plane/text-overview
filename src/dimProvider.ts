import * as vscode from 'vscode';
import { type Match } from './matcher';
import { MatchProvider } from './matchProvider';

export class DimProvider implements vscode.Disposable {
  private readonly decorationType =
    vscode.window.createTextEditorDecorationType({ opacity: '0.4' });
  private matchProvider: MatchProvider;
  private disposables: vscode.Disposable[] = [];

  constructor(matchProvider: MatchProvider) {
    this.matchProvider = matchProvider;
    this.disposables.push(
      this.matchProvider.onMatchesChange(() => {
        this.updateDecorations();
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('text-overview.dimNonMatching')) {
          this.updateDecorations();
        }
      })
    );
    this.updateDecorations();
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.decorationType.dispose();
  }

  private updateDecorations() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const dimNonMatching = vscode.workspace
      .getConfiguration('text-overview')
      .get('dimNonMatching', false as boolean);
    if (!dimNonMatching) {
      activeEditor.setDecorations(this.decorationType, []);
      return;
    }

    activeEditor.setDecorations(
      this.decorationType,
      calcNonMatchingRanges(
        this.matchProvider.getMatches(),
        activeEditor.document
      )
    );
  }
}

function calcNonMatchingRanges(
  matches: Match[],
  document: vscode.TextDocument
) {
  if (matches.length === 0) {
    return [
      new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      ),
    ];
  }

  // 合并重叠的匹配区域
  const mergedRanges = [...matches]
    .sort((a, b) => a.range.start.compareTo(b.range.start))
    .reduce((result, curr) => {
      const prev = result[result.length - 1];
      if (!prev || !prev.intersection(curr.range)) {
        result.push(curr.range);
      } else {
        result[result.length - 1] = prev.union(curr.range);
      }
      return result;
    }, [] as vscode.Range[]);

  const ranges: vscode.Range[] = [];
  let currPos = document.positionAt(0);

  // 从完整文档中挖掉匹配区域
  for (const range of mergedRanges) {
    if (range.start.compareTo(currPos) > 0) {
      ranges.push(new vscode.Range(currPos, range.start));
    }
    currPos = range.end;
  }

  // 处理最后一个匹配之后的区域
  const endPos = document.positionAt(document.getText().length);
  if (currPos.compareTo(endPos) < 0) {
    ranges.push(new vscode.Range(currPos, endPos));
  }

  return ranges;
}
