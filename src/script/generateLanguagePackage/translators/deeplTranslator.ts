import * as vscode from 'vscode';
import { deeplTranslateApi } from '../api/deepl';
import type { ITranslator, TranslateResultItem } from '../../../../types';

export class DeeplTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const text = Array.isArray(arr) ? arr.join('\n') : String(arr || '');
    const data = await deeplTranslateApi(text, language);
    if (data.error_code || data.error) {
      vscode.window.showErrorMessage(
        `DeepL 翻译失败：${data.error_msg || data.error}`,
      );
      return null;
    }
    return data.trans_result ?? null;
  }
}
