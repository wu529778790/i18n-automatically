const fs = require("fs");
const path = require("path");
const generate = require("@babel/generator").default;
const vscode = require("vscode");
const { generateUniqueId } = require("../utils");

const defaultConfig = {
  i18nImportPath: "@/i18n",
  enableI18n: true,
  i18nFilePath: "/src/i18n",
  templateI18nCall: "$t",
  scriptI18nCall: "i18n.t",
  autoImportI18n: "import i18n from '@/i18n';",
  keyFilePathLevel: 2,
  excludedExtensions: [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".md",
    ".txt",
    ".json",
    ".css",
    ".scss",
    ".less",
    ".sass",
    ".styl",
  ],
  debug: false,
  baidu: {
    appid: "",
    secretKey: "",
  },
};

const logger = {
  debug: (message, ...args) => console.debug(message, ...args),
  info: (message, ...args) => console.log(message, ...args),
  warn: (message, ...args) => console.warn(message, ...args),
  error: (message, ...args) => console.error(message, ...args),
};

function createContext(filePath, config) {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config,
    index: 0,
    translations: new Map(),
    contentSource: fs.readFileSync(filePath, "utf-8"),
    contentChanged: "",
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
    selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join("-");
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

function containsChinese(str) {
  // 匹配中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;

  // 匹配常见图片文件扩展名,增加引号的匹配考虑
  // const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)$/i;
  const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)(['"])?$/i;

  // 返回true如果包含中文且不是图片资源
  return chineseRegex.test(str) && !imageExtensionRegex.test(str);
}

function readConfig(initConfigFile = true) {
  try {
    const rootPath = getRootPath();
    const configFilePath = path.join(
      rootPath,
      "automatically-i18n-config.json"
    );

    if (!fs.existsSync(configFilePath)) {
      return handleMissingConfig(configFilePath, initConfigFile);
    }

    const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    return { ...defaultConfig, ...config };
  } catch (error) {
    logger.error("Error reading config:", error);
    return defaultConfig;
  }
}

function handleMissingConfig(configFilePath, initConfigFile) {
  if (initConfigFile) {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      logger.info("Created default config file");
      return defaultConfig;
    } catch (error) {
      logger.error("Error creating config file:", error);
    }
  }
  logger.warn("Config file not found and not initialized");
  return;
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
    const locale = config.locale || "zh";
    const filePath = path.join(
      rootPath,
      config.i18nFilePath,
      "locale",
      `${locale}.json`
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
            encoding: "utf-8",
            flag: "r",
          });
          const fileContentObj = JSON.parse(fileContent);
          updatedContent = { ...fileContentObj, ...translationObj };
        } catch (error) {
          throw new Error(
            `Error reading or parsing file: ${filePath}. ${error.message}`
          );
        }
      }

      // 写入更新后的内容
      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedContent, null, 2),
        "utf-8"
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
  readConfig,
  TranslationManager,
  logger,
};
