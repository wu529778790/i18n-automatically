const path = require("path");
const { getIndex } = require("./collectChineseText.js");

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
