const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const generate = require('@babel/generator').default;
const vscode = require('vscode');
const { generateUniqueId } = require('../../utils');
const { readConfig } = require('../setting');

function createContext(filePath, config) {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config: {
      ...config,
      isAutoImportI18n: true,
      // 默认开启：跳过调试上下文，除非配置中显式为 false
      excludeDebugContexts:
        config && 'excludeDebugContexts' in config
          ? config.excludeDebugContexts
          : true,
    },
    index: 0,
    translations: new Map(),
    // 额外保护：若传入的是目录则跳过读取，避免 EISDIR
    contentSource: (() => {
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
          throw new Error(`Not a file: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
        console.error('[i18n-automatically] read source failed:', e.message);
        return '';
      }
    })(),
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

function generateKey(context, text = '') {
  const { filePath, fileUuid, config } = context;

  // 如果配置中启用了 MD5 key 生成且提供了文本
  if (config.useMd5Key && text) {
    // 使用文本的 MD5 值作为 key，这样相同的文本会生成相同的 key，实现去重
    context.index++;
    return crypto.createHash('md5').update(text.trim()).digest('hex');
  }

  // 原有的基于组件名字的 key 生成逻辑
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
      // 避免类型不兼容报错，顶层 quotes 已设为 'single'
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

    // 标准化 i18n 根目录：允许相对/绝对；并剔除误填的 `locale` 或具体文件名
    const isWin = process.platform === 'win32';
    const configuredRaw = config.i18nFilePath || 'src/i18n';
    // Windows 兼容：处理以 / 或 \\ 开头但无盘符的“伪绝对路径”，按相对路径处理
    const looksUnixRootOnWin =
      isWin &&
      /^[\\/]+/.test(configuredRaw) &&
      !/^[a-zA-Z]:[\\/]/.test(configuredRaw);
    const normalizedConfigured = looksUnixRootOnWin
      ? configuredRaw.replace(/^[\\/]+/, '')
      : configuredRaw;

    // 在 mac/linux 上，若以 / 开头但明显不是工程内路径，按相对路径处理，避免写入系统根目录
    const appearsAbsoluteUnix = !isWin && /^[\\/]+/.test(normalizedConfigured);

    let baseDir;
    if (path.isAbsolute(normalizedConfigured)) {
      // 若绝对路径不在工程内，优先尝试将其视为相对工程根
      if (!normalizedConfigured.startsWith(rootPath) && appearsAbsoluteUnix) {
        baseDir = path.join(
          rootPath,
          normalizedConfigured.replace(/^[\\/]+/, ''),
        );
      } else {
        baseDir = normalizedConfigured;
      }
    } else {
      baseDir = path.join(rootPath, normalizedConfigured);
    }
    // 如果末级是 locale 目录，则上移一级
    if (path.basename(baseDir).toLowerCase() === 'locale') {
      baseDir = path.dirname(baseDir);
    }
    // 如果末级带 .json，当作误把文件写进配置：取其上级目录
    if (/\.json$/i.test(baseDir)) {
      baseDir = path.dirname(baseDir);
    }

    const targetDir = path.join(baseDir, 'locale');
    let filePath = path.join(targetDir, `${locale}.json`);

    // 确保传入的 translations 是一个对象
    const translationObj =
      translations instanceof Map
        ? Object.fromEntries(translations)
        : translations;

    try {
      // 确保目录存在
      fs.mkdirSync(targetDir, { recursive: true });

      let updatedContent = translationObj;

      // 如果文件存在，读取并合并内容
      if (fs.existsSync(filePath)) {
        // 若某些误配置导致 \locale\zh.json 被创建成目录，进行友好处理
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          throw new Error(
            `Expected a file but found a directory at: ${filePath}. Please remove this directory or fix i18nFilePath.`,
          );
        }
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
  stringWithDom,
};
