const vscode = require("vscode");
const fs = require("fs");
const {
  generateUniqueId,
  isInScriptComment,
  isInTemplateComment,
  saveObjectToPath,
  customLog,
  isInTemplate,
} = require("../utils");
const { getConfig } = require("./setting.js");
const { updateDecorations } = require("./switchLanguage.js");

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
    text = await fs.promises.readFile(filePath, "utf-8");

    // 生成文件的唯一标识
    const fileUuid = generateUniqueId();
    let index = 0;

    // 匹配所有中文的正则表达式，包括属性值中的中文和纯中文
    const chineseRegex = /([\w-]+)="([\u4e00-\u9fa5]+)"|[\u4e00-\u9fa5]+/g;
    let chineseMatches = [];
    let match;
    while ((match = chineseRegex.exec(text))) {
      // 记录中文匹配项及其位置
      chineseMatches.push({
        match: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // 如果没有找到中文，直接返回
    if (!chineseMatches.length) {
      customLog(config.debug, "未找到中文内容，直接返回。");
      return;
    }

    let uniqueIds = {};
    let offset = 0;
    for (let i = 0; i < chineseMatches.length; i++) {
      const { match: chineseMatch, start, end } = chineseMatches[i];
      let inTemplate = isInTemplate(text, chineseMatch);

      // 判断是否在注释中,如果在注释中，就不替换
      if (
        isInTemplateComment(text, chineseMatch) ||
        isInScriptComment(text, chineseMatch)
      ) {
        continue;
      }
      // 根据filePath
      const pathParts = filePath.split("\\");
      const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
      const lastLevelWithoutExtension =
        selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
      const selectedLevels = selectedLevelsParts
        .slice(0, -1)
        .concat(lastLevelWithoutExtension)
        .join("-");
      const uuid = `${selectedLevels}-${fileUuid}-${index}`;
      index++;
      // 如果在 template 标签
      if (inTemplate) {
        // 判断是否是属性值中的中文
        if (
          chineseMatch.match(
            /([\w-]+)="([\u4e00-\u9fa5]+(\s[\u4e00-\u9fa5]+)*)"/
          )
        ) {
          const attrName = chineseMatch.match(
            /([\w-]+)="([\u4e00-\u9fa5]+(\s[\u4e00-\u9fa5]+)*)"/
          )[1];
          const chineseValue = chineseMatch.match(
            /([\w-]+)="([\u4e00-\u9fa5]+(\s[\u4e00-\u9fa5]+)*)"/
          )[2];
          const replacementLength =
            `:${attrName}="${config.templateI18nCall}('${uuid}')"`.length;
          text =
            text.slice(0, start + offset) +
            `:${attrName}="${config.templateI18nCall}('${uuid}')"` +
            text.slice(end + offset);
          customLog(
            config.debug,
            `在模板中替换中文：原内容 ${attrName}="${chineseValue}"，替换为 :${attrName}="${config.templateI18nCall}('${uuid}')"`
          );
          uniqueIds[uuid] = chineseValue;
          offset += replacementLength - (end - start);
        } else {
          const replacement = `{{ ${config.templateI18nCall}('${uuid}') }}`;
          customLog(
            config.debug,
            `在模板中替换中文：原内容 ${chineseMatch}，替换为 ${replacement}`
          );
          const replacementLength = replacement.length;
          text =
            text.slice(0, start + offset) +
            replacement +
            text.slice(end + offset);
          uniqueIds[uuid] = chineseMatch;
          offset += replacementLength - (end - start);
        }
      } else {
        // 如果在 script 标签，且不在注释中
        const replacement = `${config.scriptI18nCall}('${uuid}')`;
        // 检查是否是单引号或双引号包裹的字符串,如果有，去掉引号
        if (
          (text[start + offset - 1] === "'" &&
            text[end + offset] === "'" &&
            text
              .slice(start + offset - 1, end + offset + 1)
              .match(/^'[\u4e00-\u9fa5]+'$/)) ||
          (text[start + offset - 1] === '"' &&
            text[end + offset] === '"' &&
            text
              .slice(start + offset - 1, end + offset + 1)
              .match(/^"[\u4e00-\u9fa5]+"/))
        ) {
          const replacementLength = replacement.length;
          text =
            text.slice(0, start + offset - 1) +
            replacement +
            text.slice(end + offset + 1);
          customLog(
            config.debug,
            `在脚本中替换中文：原内容 ${text.slice(
              start + offset - 1,
              end + offset + 1
            )}，替换为 ${replacement}`
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
    if (
      !text.match(
        /import\s+(?:\{\s*i18n\s*\}|\s*i18n\s+)\s+from\s+['"].*['"];/
      ) &&
      hasI18nUsageInScript
    ) {
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
            text.slice(scriptStartIndex + scriptStartMatch.length);
        });
      } else {
        // 不在 script 标签里面的话，就插入到第一行
        text = `${config.autoImportI18n}\n` + text;
      }
    }

    // 保存修改后的文件
    await fs.promises.writeFile(filePath, text, "utf-8");

    // 调用保存文件方法
    await saveObjectToPath(uniqueIds, `${config.i18nFilePath}/locale/zh.json`);

    // 如果是当前文件，更新装饰器
    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }

    // 清空 uniqueIds
    index = 0;
    uniqueIds = {};
    hasI18nUsageInScript = false;
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
