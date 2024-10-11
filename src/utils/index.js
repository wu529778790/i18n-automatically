const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/**
 * 生成唯一ID
 */
exports.generateUniqueId = () => {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
};

// 保存对象到指定路径的方法
exports.saveObjectToPath = (obj, filePath) => {
  const rootPath = this.getRootPath();
  const newFilePath = path.join(rootPath, filePath);
  const directory = path.dirname(newFilePath);

  return new Promise((resolve, reject) => {
    // 创建目录（如果不存在）
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let updatedContent = obj;

    // 尝试读取文件内容并合并
    if (fs.existsSync(newFilePath)) {
      try {
        const fileContent = fs.readFileSync(newFilePath, "utf-8");
        const fileContentObj = fileContent ? JSON.parse(fileContent) : {};
        updatedContent = { ...fileContentObj, ...obj };
      } catch (error) {
        reject(`Error reading or parsing file: ${newFilePath}`);
      }
    }

    // 写入更新后的内容
    try {
      fs.writeFileSync(
        newFilePath,
        JSON.stringify(updatedContent, null, 2),
        "utf-8"
      );
      resolve();
    } catch (error) {
      reject(`Error writing file: ${newFilePath}`);
    }
  });
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

/**
 * 生成唯一的 UUID
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {number} index 索引
 * @param {object} config 配置
 * @returns {string}
 */
exports.generateFileUUID = (filePath, fileUuid, index, config) => {
  const pathParts = filePath.split(path.sep);
  const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join("-");
  return `${selectedLevels}-${fileUuid}-${index + 1}`;
};

/**
 * 获取位置
 * @param {string} code 代码
 * @param {number} line 行号
 * @param {number} column 列号
 * @returns {object}
 */
exports.getPosition = (code, line, column) => {
  const lines = code.split("\n");
  let position = 0;
  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1;
  }
  position += column;
  return position;
};
