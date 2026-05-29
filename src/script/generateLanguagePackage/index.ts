import * as fs from 'fs';
import * as vscode from 'vscode';
import { getRootPath } from '../../utils/index';
import { readConfig } from '../setting';
import { createTranslator } from './translators';

const TRANSLATE_LIMIT = 20;

const serviceMap: Record<string, string> = {
  '百度翻译': 'baidu',
  'DeepL 翻译': 'deepl',
  '免费谷歌翻译': 'freeGoogle',
};

const serviceNames: Record<string, string> = {
  baidu: '百度翻译',
  deepl: 'DeepL 翻译',
  freeGoogle: '免费谷歌翻译',
};

export async function generateLanguagePackage(): Promise<void> {
  const config = readConfig(true, true);
  if (!config) return;

  const zhPath = `${getRootPath()}${config.i18nFilePath}/locale/zh.json`;
  if (!fs.existsSync(zhPath)) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件，请先扫描中文`,
    );
    return;
  }

  const hasBaiduConfig = config.baidu && config.baidu.appid && config.baidu.secretKey;
  const hasDeeplConfig = config.deepl && config.deepl.authKey;
  const hasFreeGoogleConfig = config.freeGoogle;

  if (!hasBaiduConfig && !hasDeeplConfig && !hasFreeGoogleConfig) {
    vscode.window.showInformationMessage(
      `未配置翻译服务，请先在配置文件中配置百度翻译、DeepL翻译或免费谷歌翻译的相关信息`,
    );
    const configFilePath = getRootPath() + '/automatically-i18n-config.json';
    vscode.workspace.openTextDocument(configFilePath).then((document) => {
      vscode.window.showTextDocument(document);
    });
    return;
  }

  let translateService = '';
  const serviceOptions: vscode.QuickPickItem[] = [];
  if (hasBaiduConfig) serviceOptions.push({ label: '百度翻译' });
  if (hasDeeplConfig) serviceOptions.push({ label: 'DeepL 翻译' });
  if (hasFreeGoogleConfig) serviceOptions.push({ label: '免费谷歌翻译' });

  if (serviceOptions.length > 1) {
    const selectedService = await vscode.window.showQuickPick(serviceOptions, {
      placeHolder: '请选择翻译服务',
    });
    if (!selectedService) return;
    translateService = serviceMap[selectedService.label] || '';
  } else if (serviceOptions.length === 1) {
    translateService = serviceMap[serviceOptions[0].label] || '';
  }

  const translator = createTranslator(translateService);

  const languageInput = await vscode.window.showInputBox({
    prompt: '请输入语言包名称',
    value: 'en',
  });
  const language = languageInput || 'en';

  const zhString = await fs.promises.readFile(zhPath, 'utf-8');
  if (!zhString) return;

  const zhJson: Record<string, string> = JSON.parse(zhString);
  const zhJsonKeys = Object.keys(zhJson);

  let existingLanguageJson: Record<string, string> = {};
  const existingLanguagePath = `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`;
  if (fs.existsSync(existingLanguagePath)) {
    const existingLanguageString = await fs.promises.readFile(existingLanguagePath, 'utf-8');
    existingLanguageJson = JSON.parse(existingLanguageString);
  }

  const keysToTranslate: string[] = [];
  const valuesToTranslate: string[] = [];
  zhJsonKeys.forEach((key) => {
    if (!existingLanguageJson[key]) {
      keysToTranslate.push(key);
      valuesToTranslate.push(zhJson[key]);
    }
  });

  if (keysToTranslate.length === 0) {
    vscode.window.showInformationMessage(`${language} 语言包已经全部翻译完成`);
    return;
  }

  const groupCount = Math.ceil(valuesToTranslate.length / TRANSLATE_LIMIT);
  const newLanguageJson: Record<string, string> = JSON.parse(JSON.stringify(existingLanguageJson));

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在使用${serviceNames[translateService]}生成${language}语言包`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      for (let i = 0; i < groupCount; i++) {
        const progressPercentage = ((i + 1) / groupCount) * 100;
        progress.report({ increment: progressPercentage });
        const groupItem = valuesToTranslate.slice(i * TRANSLATE_LIMIT, (i + 1) * TRANSLATE_LIMIT);
        const trans_result = await translator.translate(groupItem, language);
        if (!trans_result) continue;
        trans_result.forEach((item, index) => {
          const key = keysToTranslate[i * TRANSLATE_LIMIT + index];
          newLanguageJson[key] = item.dst;
        });
        const orderedLanguageJson: Record<string, string> = {};
        zhJsonKeys.forEach((key) => {
          if (newLanguageJson[key] !== undefined) {
            orderedLanguageJson[key] = newLanguageJson[key];
          }
        });
        await fs.promises.writeFile(
          `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
          JSON.stringify(orderedLanguageJson, null, 2),
        );
      }
    },
  );
}
