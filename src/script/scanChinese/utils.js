const path = require("path");
const fs = require("fs");
const { getIndex } = require("./collectChineseText.js");
const { getRootPath } = require("../../utils/index.js");

/**
 * 生成唯一的 UUID
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {object} config 配置
 * @returns {string}
 */
exports.generateFileUUID = (filePath, fileUuid, config) => {
  const pathParts = filePath.split(path.sep);
  const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join("-");
  const index = getIndex();
  return `${selectedLevels}-${fileUuid}-${index}`;
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

/**
 * 保存对象到指定路径的方法
 * @param {*} obj
 * @param {*} filePath
 * @returns
 */
exports.saveObjectToPath = (obj, filePath) => {
  const newFilePath = path.join(getRootPath(), filePath);
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
