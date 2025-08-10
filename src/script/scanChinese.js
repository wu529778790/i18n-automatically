const vscode = require('vscode');
const { processFile } = require('./I18nProcessor/index.js');
const { updateDecorations } = require('./switchLanguage.js');

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath = undefined) => {
  if (!filePath) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    // 对于无扩展名/二进制/隐藏文件，直接跳过
    const fsPath = editor.document.uri.fsPath;
    if (!/\.[a-zA-Z0-9]+$/.test(fsPath)) return;
    filePath = fsPath;
  }
  await processFile(filePath);
  setTimeout(() => {
    updateDecorations();
  }, 300);
};
