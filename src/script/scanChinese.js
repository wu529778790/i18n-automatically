const vscode = require("vscode");
const fs = require("fs");
const {
  generateUniqueId,
  isInCommentByPosition,
  saveObjectToPath,
  customLog,
  isInTemplate,
} = require("../utils");
const { getConfig } = require("./setting.js");
const { updateDecorations } = require("./switchLanguage.js");

/**
 * 查找文本中的所有中文
 * @param {string} text 文本内容
 * @returns {Array<{match: string, start: number, end: number}>}
 */
const findChineseMatches = (text) => {
  const chineseRegex = /[\u4e00-\u9fa5]+/g;
  const matches = [];
  let match;
  while ((match = chineseRegex.exec(text))) {
    matches.push({
      match: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
};

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>}
 */
const readFileContent = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    throw new Error(`无法读取文件 ${filePath}: ${error.message}`);
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
const generateUUID = (filePath, fileUuid, index, config) => {
  const pathParts = filePath.split("\\");
  const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join("-");
  return `${selectedLevels}-${fileUuid}-${index}`;
};

/**
 * 保存文件内容
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @returns {Promise<void>}
 */
const saveFileContent = async (filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
  } catch (error) {
    throw new Error(`无法保存文件 ${filePath}: ${error.message}`);
  }
};

/**
 * 扫描中文
 * @param {string} filePath 文件路径, 可选
 * @returns {Promise<void>}
 */
exports.scanChinese = async (filePath = undefined) => {
  // 读取配置文件
  const config = getConfig(true);

  // script 中是否有 i18n 用法的变量
  let hasI18nUsageInScript = false;

  const currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
  // 如果 filePath 不存在，那么获取当前操作文件的路径
  filePath = filePath || currentFilePath;
  customLog(config.debug, `处理文件：${filePath}`);

  let text;
  try {
    // 异步读取文件内容
    text = await readFileContent(filePath);

    // 生成文件的唯一标识
    const fileUuid = generateUniqueId();
    let index = 0;

    let chineseMatches = findChineseMatches(text);

    // 如果没有找到中文，直接返回
    if (!chineseMatches.length) {
      customLog(config.debug, "未找到中文内容，直接返回。");
      return;
    }

    customLog(config.debug, `${filePath}匹配到的中文`, chineseMatches);

    let uniqueIds = {};
    let offset = 0; // 偏移量
    for (let i = 0; i < chineseMatches.length; i++) {
      const { match: chineseMatch, start, end } = chineseMatches[i];
      // 调用 isInCommentByPosition 来判断是否在注释中
      const isComment = isInCommentByPosition(text, start, end, offset);
      // 如果在注释中，跳过本次替换
      if (isComment) {
        continue;
      }

      const uuid = generateUUID(filePath, fileUuid, index, config);
      index++;

      // 判断是否在 template 标签内
      let inTemplate = isInTemplate(text, chineseMatch);

      if (inTemplate) {
        let replacement;
        // 判断当前位置是否在属性值中
        if (text[start + offset - 2] === "=") {
          // 从等号往前找属性名的开始
          let attributeStart = start + offset - 2 - 1;
          // 找到属性名的开始位置，遇到空格或其他非字母数字字符时暂停
          while (attributeStart >= 0 && text[attributeStart].match(/[\w-]/)) {
            attributeStart--;
          }
          // 在属性名的开始位置增加冒号
          text =
            text.slice(0, attributeStart + 1) +
            ":" +
            text.slice(attributeStart + 1);
          offset++;
          replacement = `${config.templateI18nCall}('${uuid}')`;
        } else {
          replacement = `{{ ${config.templateI18nCall}('${uuid}') }}`;
        }
        const replacementLength = replacement.length;
        text =
          text.slice(0, start + offset) +
          replacement +
          text.slice(end + offset);
        uniqueIds[uuid] = chineseMatch;
        offset += replacementLength - (end - start);
        customLog(
          config.debug,
          `在模板中替换中文：原内容 ${chineseMatch}，替换为 ${replacement}`
        );
      } else {
        // 处理 script 标签内的替换逻辑
        const replacement = `${config.scriptI18nCall}('${uuid}')`;

        // 检查是否是单引号或双引号包裹的字符串,如果有，去掉引号
        const stringMatch = text
          .slice(start + offset - 1, end + offset + 1)
          .match(/^['"][\u4e00-\u9fa5]+['"]$/);
        if (stringMatch) {
          const replacementLength = replacement.length;
          text =
            text.slice(0, start + offset - 1) +
            replacement +
            text.slice(end + offset + 1);
          customLog(
            config.debug,
            `在脚本中替换中文：原内容 ${stringMatch[0]}，替换为 ${replacement}`
          );
          uniqueIds[uuid] = chineseMatch;
          offset += replacementLength - (end + 1 - (start - 1));
        } else {
          const replacementLength = replacement.length;
          text =
            text.slice(0, start + offset) +
            replacement +
            text.slice(end + offset);
          customLog(
            config.debug,
            `在脚本中替换中文：原内容 ${chineseMatch}，替换为 ${replacement}`
          );
          uniqueIds[uuid] = chineseMatch;
          offset += replacementLength - (end - start);
        }
        hasI18nUsageInScript = true;
      }
    }

    // 如果在 script 标签中没有找到 i18n 引用，并且有 i18n 的用法，就插入到引入 i18n 的语句
    const alreadyImported = text.match(/import\s+(?:i18n)\s+from\s+['"].*['"]/);
    if (!alreadyImported && hasI18nUsageInScript) {
      const scriptStartRegex = /<script\s*([^>]*)>/gs;
      const scriptStartMatches = text.match(scriptStartRegex);
      if (scriptStartMatches) {
        scriptStartMatches.forEach((scriptStartMatch) => {
          const scriptStartIndex = text.indexOf(scriptStartMatch);
          const scriptEndIndex = scriptStartIndex + scriptStartMatch.length;
          // 在 script 标签开头插入引入 i18n 的语句
          text =
            text.slice(0, scriptEndIndex) +
            `\n${config.autoImportI18n}` +
            text.slice(scriptEndIndex);
        });
      } else {
        // 如果没有 script 标签，则插入到文本开头
        text = `${config.autoImportI18n}\n` + text;
      }
    }

    // 保存修改后的文件
    await saveFileContent(filePath, text);

    // 调用保存文件方法
    await saveObjectToPath(uniqueIds, `${config.i18nFilePath}/locale/zh.json`);

    // 如果是当前文件，更新装饰器
    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }

    // 重置索引和状态
    index = 0;
    uniqueIds = {};
    hasI18nUsageInScript = false;
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
