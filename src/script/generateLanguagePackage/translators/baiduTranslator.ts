import * as vscode from 'vscode';
import { baiduTranslateApi } from '../api/baidu';
import type { ITranslator, TranslateResultItem } from '../../../types';

export class BaiduTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const text = arr.join('\n');
    const data = await baiduTranslateApi(text, language);
    if (!data) return null;
    if (data.error_code) {
      vscode.window.showErrorMessage(
        `百度翻译失败，错误码：${data.error_code}，请打开百度翻译官网查看错误信息：https://api.fanyi.baidu.com/doc/21`,
      );
      return null;
    }
    return data.trans_result ?? null;
  }
}
