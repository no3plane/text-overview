import * as vscode from 'vscode';

export type Match = {
  type: string;
  content: string;
  range: vscode.Range;
};

interface Matcher {
  findMatches(document: vscode.TextDocument): Match[];
}

// 处理单引号、双引号和模板字符串
export class QuotedStringMatcher implements Matcher {
  private regex = /(?<![/*])(?<!\w)(["'`])(?:(?=(\\?))\2.)*?\1/g;

  findMatches(document: vscode.TextDocument) {
    const matches: Match[] = [];
    const text = document.getText();

    let match;
    while ((match = this.regex.exec(text)) !== null) {
      const content = match[0].slice(1, -1); // 去掉引号
      if (!content) {
        continue;
      }

      matches.push({
        type: 'quoted',
        content: match[0],
        range: new vscode.Range(
          document.positionAt(match.index),
          document.positionAt(match.index + match[0].length)
        ),
      });
    }

    return matches;
  }
}

// 处理 JSX
export class JsxMatcher implements Matcher {
  private regex =
    /<[a-zA-Z][a-zA-Z0-9]*(\s+[a-zA-Z][a-zA-Z0-9]*="[^"]*")*\s*>([^<]*?)<\/[a-zA-Z][a-zA-Z0-9]*>/g;

  findMatches(document: vscode.TextDocument) {
    const matches: Match[] = [];
    const text = document.getText();

    let match;
    while ((match = this.regex.exec(text)) !== null) {
      const content = match[2];
      if (!content) {
        continue;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        continue;
      }

      matches.push({
        type: 'JSX文本',
        content: trimmedContent,
        range: new vscode.Range(
          document.positionAt(match.index),
          document.positionAt(match.index + match[0].length)
        ),
      });
    }

    return matches;
  }
}

// 处理 getTrans (for yxt)
export class GetTransMatcher implements Matcher {
  private regex = /\bgetTrans\s*\([\n\s]*(.*?)\s*(\/\*.*?\*\/)?\s*(,|\))/g;

  findMatches(document: vscode.TextDocument) {
    const matches: Match[] = [];
    const text = document.getText();

    let match;
    while ((match = this.regex.exec(text)) !== null) {
      if (!match[2]) {
        continue;
      }

      const comment = match[2].slice(2, -2).trim();
      if (!comment) {
        continue;
      }

      matches.push({
        content: comment,
        range: new vscode.Range(
          document.positionAt(match.index),
          document.positionAt(match.index + match[0].length)
        ),
        type: 'getTrans',
      });
    }

    return matches;
  }
}
