import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getRootPath } from '../utils';
import type { I18nConfig } from '../types';

const defaultConfig: I18nConfig = {
  i18nFilePath: '/src/i18n',
  autoImportI18n: true,
  i18nImportPath: '@/i18n',
  templateI18nCall: '$t',
  scriptI18nCall: 'i18n.global.t',
  keyFilePathLevel: 2,
  excludeDebugContexts: false,
  excludedExtensions: [
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico',
    '.md', '.txt', '.json', '.css', '.scss', '.less', '.sass', '.styl',
  ],
  excludedStrings: [
    '宋体', '黑体', '楷体', '仿宋', '微软雅黑', '华文', '方正', '苹方', '思源',
    'YYYY年MM月DD日',
  ],
  freeGoogle: true,
  baidu: { appid: '', secretKey: '' },
  deepl: { authKey: '', isPro: false },
  useMd5Key: false,
};

/** 打开或创建配置文件 */
export function setting(): void {
  const rootPath = getRootPath();
  const configFilePath = path.join(rootPath, '/automatically-i18n-config.json');
  if (!fs.existsSync(configFilePath)) {
    handleMissingConfig(configFilePath, true);
  }
  vscode.workspace.openTextDocument(configFilePath).then((document) => {
    vscode.window.showTextDocument(document);
  });
}

let cacheConfig: I18nConfig | undefined;

/** 获取最新的配置文件 */
export function readConfig(
  initConfigFile = false,
  clearCache = false,
): I18nConfig | undefined {
  if (cacheConfig && !clearCache) {
    return cacheConfig;
  }
  cacheConfig = initConfigFn(initConfigFile);
  return cacheConfig;
}

function initConfigFn(initConfigFile = true): I18nConfig {
  try {
    const rootPath = getRootPath();
    const configFilePath = path.join(rootPath, '/automatically-i18n-config.json');
    if (!fs.existsSync(configFilePath)) {
      return handleMissingConfig(configFilePath, initConfigFile) ?? defaultConfig;
    }
    const config: Partial<I18nConfig> = JSON.parse(
      fs.readFileSync(configFilePath, 'utf8'),
    );
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.error('读取配置文件时出现错误：', error);
    return defaultConfig;
  }
}

function handleMissingConfig(
  configFilePath: string,
  initConfigFile: boolean,
): I18nConfig | undefined {
  if (initConfigFile) {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.error('创建配置文件时出现错误：', error);
    }
  }
  return undefined;
}
