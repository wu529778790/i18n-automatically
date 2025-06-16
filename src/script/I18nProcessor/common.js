const fs = require('fs');
const path = require('path');
const generate = require('@babel/generator').default;
const vscode = require('vscode');
const { generateUniqueId } = require('../../utils');
const { readConfig } = require('../setting');
const customConsole = require('../../utils/customConsole.js');

function createContext(filePath, config) {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config: {
      ...config,
      isAutoImportI18n: true,
    },
    index: 0,
    translations: new Map(),
    contentSource: fs.readFileSync(filePath, 'utf-8'),
    contentChanged: '',
    ast: null,
  };
}

function createI18nProcessor(astProcessor) {
  return function (filePath, config) {
    const context = createContext(filePath, config);
    return astProcessor(context);
  };
}

function generateKey(context) {
  const { filePath, fileUuid, config } = context;
  const pathParts = filePath.split(path.sep);
  const pathDeep = config.keyFilePathLevel || 2;
  const selectedLevelsParts = pathParts.slice(-pathDeep);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split('.')[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join('-');
  context.index++;
  return `${selectedLevels}-${fileUuid}-${context.index}`;
}

function generateCode(ast, content) {
  const opts = {
    retainLines: true,
    jsonCompatibleStrings: true,
    flowCommaSeparator: true,
    quotes: 'single', // 强制使用单引号
    jsescOption: {
      quotes: 'single', // 确保字符串内容也使用单引号
      wrap: true,
    },
  };
  return generate(ast, opts, content).code;
}
function stringWithDom(str) {
  // /<\/?[a-z][\s\S]*?>/i.test(value)
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}

function containsChinese(str, isExcluded = false) {
  // 匹配中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  // 如果没有中文字符，立即返回 false
  if (!chineseRegex.test(str)) {
    return false;
  }
  // 匹配常见图片文件扩展名
  const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)(['"]|\?[^'"\s]*)?$/i;
  // 如果是图片资源，返回 false
  if (imageExtensionRegex.test(str)) {
    return false;
  }
  // 如果 isExcluded 为 false，进行额外的排除检查
  if (!isExcluded) {
    // 确保配置已加载
    const config = readConfig();
    if (
      Array.isArray(config.excludedStrings) &&
      config.excludedStrings.length
    ) {
      // 检查是否被排除
      const isExcludedByConfig = config.excludedStrings.includes(str.trim());
      // 如果被配置排除，返回 false
      if (isExcludedByConfig) {
        return false;
      }
    }
  }
  // 如果包含中文且不是图片资源且没有被排除，返回 true
  return true;
}

class TranslationManager {
  constructor() {
    // 假设这个方法在其他地方定义
    this.getRootPath = () => {
      // 这里应该返回实际的根路径
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders[0] && workspaceFolders[0].uri) {
        return workspaceFolders[0].uri.fsPath || '';
      }
      return '';
    };
  }

  /**
   * 将翻译对象同步保存到指定路径的 JSON 文件中
   * @param {Map|Object} translations - 翻译数据，可以是 Map 或普通对象
   * @param {Object} config - 配置对象
   * @param {string} config.i18nFilePath - i18n 文件的相对路径
   * @param {string} [config.locale='zh'] - 语言代码
   */
  outputTranslationFile(translations, config) {
    const rootPath = this.getRootPath();
    const locale = config.locale || 'zh';
    const filePath = path.join(
      rootPath,
      config.i18nFilePath,
      'locale',
      `${locale}.json`,
    );

    // 确保传入的 translations 是一个对象
    const translationObj =
      translations instanceof Map
        ? Object.fromEntries(translations)
        : translations;

    try {
      // 确保目录存在
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      let updatedContent = translationObj;

      // 如果文件存在，读取并合并内容
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, {
            encoding: 'utf-8',
            flag: 'r',
          });
          if (fileContent.trim()) {
            const fileContentObj = JSON.parse(fileContent);
            updatedContent = { ...fileContentObj, ...translationObj };
          } else {
            updatedContent = { ...translationObj };
          }
        } catch (error) {
          throw new Error(
            `Error reading or parsing file: ${filePath}. ${error.message}`,
          );
        }
      }

      // 写入更新后的内容
      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
      customConsole.log(`Successfully updated translation file: ${filePath}`);
    } catch (error) {
      customConsole.error(
        `Failed to output translation file: ${error.message}`,
      );
      throw error; // 重新抛出错误，允许调用者进行进一步处理
    }
  }
}

module.exports = {
  createI18nProcessor,
  generateKey,
  generateCode,
  containsChinese,
  TranslationManager,
  customConsole,
  stringWithDom,
};
