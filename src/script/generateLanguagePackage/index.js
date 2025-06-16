const fs = require('fs');
const vscode = require('vscode');
const { getRootPath } = require('../../utils/index.js');
const { readConfig } = require('../setting.js');
const { createTranslator } = require('./translators');
const customConsole = require('../../utils/customConsole.js');

// 一次请求翻译多少个中文
const TRANSLATE_LIMIT = 20;

exports.generateLanguagePackage = async () => {
  const config = readConfig(true, true);
  const zhPath = `${getRootPath()}${config.i18nFilePath}/locale/zh.json`;

  // 判断中文语言包文件是否存在
  if (!fs.existsSync(zhPath)) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件，请先扫描中文`,
    );
    return;
  }
  // 检查翻译服务配置
  const hasBaiduConfig =
    config.baidu && config.baidu.appid && config.baidu.secretKey;
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

  // 选择翻译服务
  let translateService = '';
  const serviceOptions = [];
  if (hasBaiduConfig) {
    serviceOptions.push({ label: '百度翻译', value: 'baidu' });
  }
  if (hasDeeplConfig) {
    serviceOptions.push({ label: 'DeepL 翻译', value: 'deepl' });
  }
  if (hasFreeGoogleConfig) {
    serviceOptions.push({ label: '免费谷歌翻译', value: 'freeGoogle' });
  }

  if (serviceOptions.length > 1) {
    const selectedService = await vscode.window.showQuickPick(serviceOptions, {
      placeHolder: '请选择翻译服务',
    });
    if (!selectedService) return;
    translateService = selectedService.value;
  } else if (serviceOptions.length === 1) {
    translateService = serviceOptions[0].value;
  }

  const translator = createTranslator(translateService);

  // 获取用户输入的语言包名称，如果用户未输入，则默认为'en'
  const languageInput = await vscode.window.showInputBox({
    prompt: '请输入语言包名称',
    value: 'en',
  });
  const language = languageInput || 'en';

  // 读取中文语言包文件内容
  const zhString = await fs.promises.readFile(zhPath, 'utf-8');
  if (!zhString) return;

  // 将中文语言包内容转换为 JSON 对象
  const zhJson = JSON.parse(zhString);
  const zhJsonKeys = Object.keys(zhJson);

  // 读取已有的目标语言包文件（如果存在）
  let existingLanguageJson = {};
  const existingLanguagePath = `${getRootPath()}${
    config.i18nFilePath
  }/locale/${language}.json`;
  if (fs.existsSync(existingLanguagePath)) {
    const existingLanguageString = await fs.promises.readFile(
      existingLanguagePath,
      'utf-8',
    );
    existingLanguageJson = JSON.parse(existingLanguageString);
  }

  // 过滤出需要翻译的中文键和值
  const keysToTranslate = [];
  const valuesToTranslate = [];
  zhJsonKeys.forEach((key) => {
    if (!existingLanguageJson[key]) {
      keysToTranslate.push(key);
      valuesToTranslate.push(zhJson[key]);
    }
  });

  // 如果没有需要翻译的键，则提示用户
  if (keysToTranslate.length === 0) {
    vscode.window.showInformationMessage(`${language} 语言包已经全部翻译完成`);
    return;
  }

  // 计算需要发送的请求次数
  const valuesToTranslateLengthgroup = Math.ceil(
    valuesToTranslate.length / TRANSLATE_LIMIT,
  );
  const newLanguageJson = JSON.parse(JSON.stringify(existingLanguageJson));

  const serviceNames = {
    baidu: '百度翻译',
    deepl: 'DeepL 翻译',
    freeGoogle: '免费谷歌翻译',
  };

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在使用${serviceNames[translateService]}生成${language}语言包`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      for (let i = 0; i < valuesToTranslateLengthgroup; i++) {
        // 计算进度
        const progressPercentage =
          ((i + 1) / valuesToTranslateLengthgroup) * 100;
        progress.report({ increment: progressPercentage });
        const valuesToTranslateLengthgroupArrItem = valuesToTranslate.slice(
          i * TRANSLATE_LIMIT,
          (i + 1) * TRANSLATE_LIMIT,
        );

        const trans_result = await translator.translate(
          valuesToTranslateLengthgroupArrItem,
          language,
        );

        if (!trans_result) {
          continue;
        }

        customConsole.log(config.debug, '翻译结果', trans_result);
        // 将翻译结果添加到目标语言包对象中
        trans_result.forEach((item, index) => {
          const key = keysToTranslate[i * TRANSLATE_LIMIT + index];
          newLanguageJson[key] = item.dst;
        });

        // 每翻译完一组就立即写入文件，防止翻译中断丢失数据
        // 按照zh.json的键顺序重新组织目标语言包，确保顺序一致
        const orderedLanguageJson = {};
        zhJsonKeys.forEach((key) => {
          if (newLanguageJson[key] !== undefined) {
            orderedLanguageJson[key] = newLanguageJson[key];
          }
        });

        await fs.promises.writeFile(
          `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
          JSON.stringify(orderedLanguageJson, null, 2),
        );
        customConsole.log(
          config.debug,
          `已保存第 ${i + 1}/${valuesToTranslateLengthgroup} 组翻译结果`,
        );
      }
    },
  );
};
