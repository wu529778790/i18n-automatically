const vscode = require("vscode");
const { processFile } = require("./I18nProcessor/index.js");
const { updateDecorations } = require("./switchLanguage.js");

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath = undefined) => {
  if (!filePath) {
    filePath = vscode.window.activeTextEditor.document.uri.fsPath;
  }
  await processFile(filePath);
  setTimeout(() => {
    updateDecorations();
  }, 300);
};
