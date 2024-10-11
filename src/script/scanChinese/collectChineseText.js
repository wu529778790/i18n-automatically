const { saveObjectToPath } = require("./utils.js");

let chineseTexts = new Map();
let index = 0;

/**
 * 获取索引值
 */
exports.getIndex = () => {
  return index;
};

/**
 * 收集中文文本
 * @param {string} fileUuid 文件 UUID
 * @param {string} content 文件内容
 */
exports.collectChineseText = (fileUuid, content) => {
  if (typeof content !== "string") {
    return;
  }
  content = content.trim();
  if (content && !chineseTexts.has(fileUuid)) {
    chineseTexts.set(fileUuid, content);
    index++;
  }
};

/**
 * 保存收集到的中文文本
 */
exports.saveChineseTexts = async (config) => {
  const obj = Object.fromEntries(chineseTexts);
  if (Object.keys(obj).length > 0) {
    await saveObjectToPath(obj, `${config.i18nFilePath}/locale/zh.json`);
  }
};

/**
 * 清空收集到的中文文本
 */
exports.clearChineseTexts = () => {
  index = 0;
  chineseTexts.clear();
};
