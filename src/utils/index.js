const vscode = require("vscode");
const fs = require("fs");

/**
 * 生成唯一ID
 */
exports.generateUniqueId = () => {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
};

/**
 * 获取根目录
 */
exports.getRootPath = () => {
  return vscode.workspace.workspaceFolders[0].uri.fsPath;
};

// 导出一个名为 customLog 的函数，用于有条件地记录日志
exports.customLog = (debug, ...args) => {
  // 如果 debug 参数为真，即开发模式下
  if (debug) {
    console.log(...args);
  }
};

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>}
 */
exports.readFileContent = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(`无法读取文件 ${filePath}: ${error.message}`);
  }
};

/**
 * 保存文件内容
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @returns {Promise<void>}
 */
exports.saveFileContent = async (filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
  } catch (error) {
    throw new Error(`无法保存文件 ${filePath}: ${error.message}`);
  }
};
