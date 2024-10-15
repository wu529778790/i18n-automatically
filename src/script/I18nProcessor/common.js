const fs = require('fs');
const path = require('path');
const generate = require('@babel/generator').default;
const vscode = require('vscode');
const { generateUniqueId } = require('../../utils');
const { readConfig } = require('../setting');

const cutomConsole = require('../../utils/cutomConsole.js');

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
  const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
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
  };
  return generate(ast, opts, content).code;
}
function stringWithDom(str) {
  // /<\/?[a-z][\s\S]*?>/i.test(value)
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}

function containsChinese(str) {
  // 匹配中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;

  // 匹配常见图片文件扩展名,增加引号的匹配考虑
  // const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)$/i;
  // const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)(['"])?$/i;
  const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)(['"]|\?[^'"\s]*)?$/i;

  const isChinese = chineseRegex.test(str);
  // 确保配置已加载
  const config = readConfig();

  // 首先使用 includes 进行快速检查
  const isExcludedByIncludes = isChinese
    ? config.excludedStrings.some((excluded) => str.includes(excluded))
    : false;

  // 如果快速检查未排除，则使用正则表达式进行更复杂的检查
  // const isExcluded = isExcludedByIncludes;//|| excludedRegex.test(str);

  // 返回true如果包含中文且不是图片资源
  return isChinese && !imageExtensionRegex.test(str) && !isExcludedByIncludes;
}

const getRootPath = () => {
  return vscode.workspace.workspaceFolders[0].uri.fsPath;
};

class TranslationManager {
  constructor() {
    // 假设这个方法在其他地方定义
    this.getRootPath = () => {
      // 这里应该返回实际的根路径
      return getRootPath();
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
          const fileContentObj = JSON.parse(fileContent);
          updatedContent = { ...fileContentObj, ...translationObj };
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
      console.log(`Successfully updated translation file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to output translation file: ${error.message}`);
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
  cutomConsole,
  stringWithDom,
};
