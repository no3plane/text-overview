import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';
import * as path from 'path';
import * as fs from 'fs';
import { TreeProvider } from '../tree';
import { MatchProvider } from '../matchProvider';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('测试', async () => {
    const testFile = path.join(__dirname, 'test.jsx');
    const testContent = `
			// 普通字符串
			const str1 = "hello";
			const str2 = 'world';
			const str3 = \`template\`;

			// 空字符串（应该被过滤）
			const empty1 = "";
			const empty2 = '';
			const empty3 = \`\`;

			// JSX 属性中的字符串
			const jsx1 = <div className="container" title='hello'>content</div>;

			// JSX Fragment 中的文本
			const jsx2 = <>fragment text</>;

			// 注释中的字符串（应该被过滤）
			// const comment1 = "comment string";
			/* const comment2 = 'comment string'; */

			// 多行 JSX
			const jsx3 = (
				<div>
					<span>nested</span>
					<p>text</p>
				</div>
			);
		`;

    fs.writeFileSync(testFile, testContent);

    try {
      const document = await vscode.workspace.openTextDocument(testFile);
      await vscode.window.showTextDocument(document);

      // 等待扩展激活
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const provider = new TreeProvider(new MatchProvider());
      const items = await provider.getChildren();

      assert.strictEqual(items.length, 9, '应该找到 9 个字符串字面量');

      assert.strictEqual(items[0].label, '"hello"', '应该识别双引号字符串');
      assert.strictEqual(items[1].label, "'world'", '应该识别单引号字符串');
      assert.strictEqual(items[2].label, '`template`', '应该识别模板字符串');

      assert.strictEqual(
        items[3].label,
        '[JSX] "container"',
        '应该识别 JSX 属性中的双引号字符串'
      );
      assert.strictEqual(
        items[4].label,
        "[JSX] 'hello'",
        '应该识别 JSX 属性中的单引号字符串'
      );
      assert.strictEqual(
        items[5].label,
        '[JSX] "content"',
        '应该识别 JSX 标签中的文本'
      );

      // 验证 Fragment 中的文本
      assert.strictEqual(
        items[6].label,
        '[JSX Fragment] "fragment text"',
        '应该识别 Fragment 中的文本'
      );

      // 验证嵌套 JSX 中的文本
      assert.strictEqual(
        items[7].label,
        '[JSX] "nested"',
        '应该识别嵌套 JSX 中的文本'
      );
      assert.strictEqual(
        items[8].label,
        '[JSX] "text"',
        '应该识别嵌套 JSX 中的文本'
      );

      const emptyStrings = items.filter(
        (item) =>
          item.label === '""' || item.label === "''" || item.label === '``'
      );
      assert.strictEqual(emptyStrings.length, 0, '空字符串应该被过滤');

      const commentStrings = items.filter(
        (item) =>
          item.label === '"comment string"' || item.label === "'comment string'"
      );
      assert.strictEqual(commentStrings.length, 0, '注释中的字符串应该被过滤');
    } finally {
      fs.unlinkSync(testFile);
    }
  });
});
