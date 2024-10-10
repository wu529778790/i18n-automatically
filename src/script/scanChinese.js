const vscode = require("vscode");
const { processFile } = require("../I18nProcessor/index.js");

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath = undefined) => {
  try {
    let currentFilePath;
    if (!filePath) {
      currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
      filePath = currentFilePath;
    }
    await processFile(filePath);
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
