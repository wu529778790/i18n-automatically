const vscode = require('vscode');
const {
  setting,
  readConfig,
  scanChinese,
  scanChineseBatch,
  switchLanguage,
  updateDecorations,
  generateLanguagePackage,
} = require('./script/index.js');

/**
 * @description 激活插件
 * @param {vscode.ExtensionContext} context
 */
exports.activate = (context) => {
  // // 更新装饰器
  // setTimeout(() => {
  //   updateDecorations();
  // }, 300);

  // 当编辑器中的选择发生变化时，更新装饰器
  vscode.window.onDidChangeVisibleTextEditors(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });

  // 当文本文档被保存时
  vscode.workspace.onDidSaveTextDocument(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });

  // 扫描中文
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.scanChinese',
      async () => {
        readConfig(true, true);
        scanChinese();
      },
    ),
  );

  // 批量扫描中文
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.scanChineseBatch',
      async () => {
        readConfig(true, true);
        scanChineseBatch();
      },
    ),
  );

  // 生成语言包
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.generateLanguagePackage',
      async () => {
        generateLanguagePackage();
      },
    ),
  );

  // 切换语言
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.switchLanguage',
      switchLanguage,
    ),
  );

  // 刷新数据
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.updateLocalLangPackage',
      async () => {
        updateDecorations;
      },
    ),
  );

  // 设置
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.setting',
      async () => {
        setting();
      },
    ),
  );
};
