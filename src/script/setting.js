const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const { getRootPath } = require("../utils");

const defaultConfig = {
  i18nFilePath: "/src/i18n",
  i18nImportPath: "@/i18n",
  templateI18nCall: "$t",
  scriptI18nCall: "i18n.t",
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
exports.readConfig = (initConfigFile = true) => {
  try {
    const rootPath = getRootPath();
    const configFilePath = path.join(
      rootPath,
      "/automatically-i18n-config.json"
    );
    // 检查配置文件是否存在
    if (!fs.existsSync(configFilePath)) {
      return handleMissingConfig(configFilePath, initConfigFile);
    }
    // 如果存在, 读取配置文件并返回
    const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.error("读取配置文件时出现错误：", error);
    return defaultConfig;
  }
};

function handleMissingConfig(configFilePath, initConfigFile) {
  if (initConfigFile) {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.error("创建配置文件时出现错误：", error);
    }
  }
  return;
}
