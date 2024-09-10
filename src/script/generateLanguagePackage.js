const fs = require("fs");
const vscode = require("vscode");
const { getRootPath } = require("../utils/index.js");
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
  const zhJsonValues = Object.values(zhJson);
  const zhJsonKeys = Object.keys(zhJson);
  const zhJsonValuesLength = zhJsonValues.length;

  // 计算需要发送的请求次数
  const zhJsonValuesLengthgroup = Math.ceil(
    zhJsonValuesLength / TRANSLATE_LIMIT
  );
  const enJsonObj = JSON.parse(JSON.stringify(zhJson));

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在生成${language}语言包`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      for (let i = 0; i < zhJsonValuesLengthgroup; i++) {
        // 计算进度
        const progressPercentage = ((i + 1) / zhJsonValuesLengthgroup) * 100;
        progress.report({ increment: progressPercentage });
        const zhJsonValuesLengthgroupArrItem = zhJsonValues.slice(
          i * TRANSLATE_LIMIT,
          (i + 1) * TRANSLATE_LIMIT
        );
        const zhJsonValuesLengthgroupArrItemString =
          zhJsonValuesLengthgroupArrItem.join("\n");
        const data = await baiduTranslateApi(
          zhJsonValuesLengthgroupArrItemString,
          language
        );
        data.forEach((item, index) => {
          enJsonObj[zhJsonKeys[i * TRANSLATE_LIMIT + index]] = item.dst;
        });
      }
    }
  );

  // 生成指定语言的语言包文件
  await fs.promises.writeFile(
    `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
    JSON.stringify(enJsonObj, null, 2)
  );
};
