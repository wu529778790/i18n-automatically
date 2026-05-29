import * as vscode from 'vscode';
import { googleTranslateApi } from '../api/freeGoogle';
import type { ITranslator, TranslateResultItem } from '../../../types';

export class GoogleTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const trans_result: TranslateResultItem[] = [];
    for (const text of arr) {
      const data = await googleTranslateApi(text, language);
      if (data.error_code) {
        vscode.window.showErrorMessage(
          `免费谷歌翻译失败，错误码：${data.error_code}，请稍后重试`,
        );
        trans_result.push({ dst: '' });
      } else {
        trans_result.push(data.trans_result![0]);
      }
    }
    return trans_result;
  }
}
