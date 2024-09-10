const fs = require("fs");
const vscode = require("vscode");
const { getRootPath } = require("../utils");

const defaultConfig = {
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

/**
 * 设置
 */
exports.setting = () => {
  const rootPath = getRootPath();
  const configFilePath = rootPath + "/automatically-i18n-config.json";
  // 检查配置文件是否存在，如果不存在则创建
  if (!fs.existsSync(configFilePath)) {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
    } catch (error) {
      console.error("创建配置文件时出现错误：", error);
    }
  }
  // 如果存在, 打开配置文件
  vscode.workspace.openTextDocument(configFilePath).then((document) => {
    vscode.window.showTextDocument(document);
  });
};

/**
 * 获取最新的配置文件
 */
exports.getConfig = (initConfigFile = false) => {
  const rootPath = getRootPath();
  const configFilePath = rootPath + "/automatically-i18n-config.json";
  // 检查配置文件是否存在
  if (!fs.existsSync(configFilePath)) {
    // 需要初始化配置文件
    if (initConfigFile) {
      try {
        fs.writeFileSync(
          configFilePath,
          JSON.stringify(defaultConfig, null, 2)
        );
      } catch (error) {
        console.error("创建配置文件时出现错误：", error);
      }
      return defaultConfig;
    }
    return;
  }
  // 如果存在, 读取配置文件并返回
  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  return {
    ...defaultConfig,
    ...config,
  };
};
