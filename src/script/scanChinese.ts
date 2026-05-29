import * as vscode from 'vscode';
import { processFile } from './I18nProcessor/index';
import { updateDecorations } from './switchLanguage';

/** 扫描当前文件中的中文 */
export async function scanChinese(
  filePath: string | undefined = undefined,
): Promise<void> {
  if (!filePath) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const fsPath = editor.document.uri.fsPath;
    if (!/\.[a-zA-Z0-9]+$/.test(fsPath)) return;
    filePath = fsPath;
  }
  await processFile(filePath);
  setTimeout(() => {
    updateDecorations();
  }, 300);
}
