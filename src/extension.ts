import * as vscode from 'vscode';
import {
  setting,
  readConfig,
  scanChinese,
  scanChineseBatch,
  switchLanguage,
  updateDecorations,
  generateLanguagePackage,
} from './script/index';

export function activate(context: vscode.ExtensionContext): void {
  vscode.window.onDidChangeVisibleTextEditors(() => {
    setTimeout(() => { updateDecorations(); }, 300);
  });

  vscode.workspace.onDidSaveTextDocument(() => {
    setTimeout(() => { updateDecorations(); }, 300);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.scanChinese', async () => {
      readConfig(true, true);
      scanChinese();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.scanChineseBatch', async () => {
      readConfig(true, true);
      scanChineseBatch();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.generateLanguagePackage', async () => {
      generateLanguagePackage();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.switchLanguage', switchLanguage),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.updateLocalLangPackage', async () => {
      updateDecorations();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.automatically.i18n.setting', async () => {
      setting();
    }),
  );
}
