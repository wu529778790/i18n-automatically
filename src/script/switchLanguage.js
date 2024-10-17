const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { readConfig } = require('./setting.js');
const { getRootPath } = require('../utils/index.js');
const customConsole = require('../utils/customConsole.js');

let cachedLanguage = 'zh.json'; // 初始化缓存变量

// 获取语言包
const getLanguagePack = async (language = cachedLanguage) => {
  // 读取配置文件
  const config = readConfig();
  if (!config) {
    return;
  }
  // 获取根路径
  const rootPath = getRootPath();
  // 获取语言包绝对路径
  const i18nFilePath = path.join(
    `${rootPath}${config.i18nFilePath}/locale/${language}`,
  );

  // 判断文件是否存在
  if (!fs.existsSync(i18nFilePath)) {
    if (language !== 'zh.json') {
      vscode.window.showInformationMessage(
        `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 ${language} 语言包文件，将使用默认语言包。`,
      );
    }
    // 可以返回默认语言包数据或者空对象等，根据你的需求进行调整
    return;
  }

  // 异步读取文件内容
  const languagePack = await fs.promises.readFile(i18nFilePath, 'utf-8');
  if (!languagePack) {
    return;
  }
  try {
    const languagePackObj = JSON.parse(languagePack);
    return languagePackObj;
  } catch (error) {
    customConsole.log(error);
  }
};

// 使用正则表达式进行匹配，确保只完全匹配特定的键
const buildRegexFromLanguagePack = (languagePackObj) => {
  const keys = Object.keys(languagePackObj);
  const escapedKeys = keys.map((key) => {
    // 转义特殊字符，并添加起始和结束边界限定符
    return `\\b${key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`;
  });
  return new RegExp(`(${escapedKeys.join('|')})`, 'g');
};

/**
 * 使用单例模式管理装饰器类型，确保只创建一个装饰器类型的实例
 *
 * 获取装饰类型，如果不存在，则创建一个新的装饰类型对象
 * 装饰类型对象用于在 VSCode 编辑器中定义装饰的样式
 * 如果 decorationType 变量不存在，则创建一个具有特定样式的新装饰类型对象
 * 创建的装饰类型对象具有整行装饰、闭合行为、灰色的概述标尺颜色和位于左侧的概述标尺通道
 * 如果 decorationType 变量已经存在，则直接返回该变量
 *
 * @return {vscode.TextEditorDecorationType} 装饰类型对象，可以用于装饰代码
 */
let decorationType;
function getDecorationType() {
  if (!decorationType) {
    decorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      overviewRulerColor: 'grey',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
      after: {
        margin: '0 0 0 5px', // 添加 margin 样式，这里设置为左右各 5 像素的边距
      },
    });
  }
  return decorationType;
}

exports.updateDecorations = async (language = cachedLanguage) => {
  // 读取配置文件
  const config = readConfig();
  if (!config) {
    return;
  }
  // 获取当前文件
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const languageId = editor.document.languageId;
  // 如果当前文件的语言类型是 excludedExtensions 中的类型，则直接返回
  // 比如 excludedExtensions: [".sass", ".styl"], 那么如果当前文件的语言类型是.sass 或.styl，则直接返回
  if (config.excludedExtensions.includes(`.${languageId}`)) {
    return;
  }
  const languagePackObj = await getLanguagePack(language);
  if (!languagePackObj) {
    return;
  }
  const foregroundColor = new vscode.ThemeColor('editorCodeLens.foreground');

  if (editor) {
    const regex = buildRegexFromLanguagePack(languagePackObj);
    const decorations = [];
    for (let i = 0; i < editor.document.lineCount; i++) {
      const line = editor.document.lineAt(i);
      const text = line.text;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const contentText = languagePackObj[match[0]];
        if (!contentText) {
          continue;
        }
        decorations.push({
          range: new vscode.Range(
            i,
            match.index,
            i,
            match.index + match[0].length,
          ),
          renderOptions: {
            after: {
              contentText,
              color: foregroundColor,
              opacity: '0.6',
            },
          },
        });
      }
    }
    editor.setDecorations(getDecorationType(), decorations);
  }
};

exports.switchLanguage = async () => {
  // 读取配置文件
  const config = readConfig(true);
  // 读取 i18n 文件夹下 locale 目录下的文件，并过滤出.json 文件
  const rootPath = getRootPath();
  const allFiles = fs.readdirSync(`${rootPath}${config.i18nFilePath}/locale`);
  const languageFiles = allFiles.filter((file) => file.endsWith('.json'));
  if (!languageFiles.length) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到语言包文件，请先扫描中文`,
    );
    return;
  }
  // 打开 vscode 快捷命令
  vscode.window.showQuickPick(languageFiles).then(async (item) => {
    if (item) {
      cachedLanguage = item; // 缓存用户选择的语言
      await this.updateDecorations(item);
    }
  });
};
