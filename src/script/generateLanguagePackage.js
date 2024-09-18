const fs = require("fs");
const vscode = require("vscode");
const { getRootPath, customLog } = require("../utils/index.js");
const { getConfig } = require("./setting.js");
const { baiduTranslateApi } = require("../api/baidu.js");

// 一次请求翻译多少个中文
const TRANSLATE_LIMIT = 20;

exports.generateLanguagePackage = async () => {
  const config = getConfig(true);
  const zhPath = `${getRootPath()}${config.i18nFilePath}/locale/zh.json`;

  // 判断中文语言包文件是否存在
  if (!fs.existsSync(zhPath)) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件，请先扫描中文`
    );
    return;
  }
  // 判断config是否配置了百度翻译的 appid 和 secretKey
  if (!config.baidu.appid || !config.baidu.secretKey) {
    vscode.window.showInformationMessage(
      `未配置百度翻译的 appid 和 secretKey，请先在配置文件中配置`
    );

    const configFilePath = getRootPath() + "/automatically-i18n-config.json";
    vscode.workspace.openTextDocument(configFilePath).then((document) => {
      vscode.window.showTextDocument(document);
    });
    return;
  }

  // 获取用户输入的语言包名称
  const language = await vscode.window.showInputBox({
    prompt: "请输入语言包名称",
    value: "en",
  });

  // 读取中文语言包文件内容
  const zhString = await fs.promises.readFile(zhPath, "utf-8");
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
      "utf-8"
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

  // 计算需要发送的请求次数
  const valuesToTranslateLengthgroup = Math.ceil(
    valuesToTranslate.length / TRANSLATE_LIMIT
  );
  const newLanguageJson = JSON.parse(JSON.stringify(existingLanguageJson));

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在生成${language}语言包`,
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
          (i + 1) * TRANSLATE_LIMIT
        );
        const valuesToTranslateLengthgroupArrItemString =
          valuesToTranslateLengthgroupArrItem.join("\n");
        const data = await baiduTranslateApi(
          valuesToTranslateLengthgroupArrItemString,
          language
        );
        customLog(config.debug, "翻译结果", data);
        // 将翻译结果添加到目标语言包对象中
        data.forEach((item, index) => {
          const key = keysToTranslate[i * TRANSLATE_LIMIT + index];
          newLanguageJson[key] = item.dst;
        });
      }
    }
  );

  // 生成指定语言的语言包文件
  await fs.promises.writeFile(
    `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
    JSON.stringify(newLanguageJson, null, 2)
  );
};
