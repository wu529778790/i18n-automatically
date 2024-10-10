const vscode = require("vscode");
const { processFile } = require("../I18nProcessor/index.js");
const { updateDecorations } = require("./switchLanguage.js");

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath = undefined) => {
  try {
    if (!filePath) {
      filePath = vscode.window.activeTextEditor.document.uri.fsPath;
    }
    await processFile(filePath);
    setTimeout(() => {
      updateDecorations();
    }, 300);
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
