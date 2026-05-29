import axios from 'axios';
import { readConfig } from '../../../setting';
import type { TranslateResult } from '../../../../types';

export async function deeplTranslateApi(
  text: string,
  targetLanguage = 'en',
): Promise<TranslateResult> {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return { error: '未找到配置文件' } as TranslateResult;
  }

  const { authKey, isPro } = config.deepl;
  if (!authKey) {
    console.error('未配置 DeepL 认证密钥');
    return { error: '未配置 DeepL 认证密钥' } as TranslateResult;
  }

  const targetLang = targetLanguage.toUpperCase();
  const baseUrl = isPro
    ? 'https://api.deepl.com/v2/translate'
    : 'https://api-free.deepl.com/v2/translate';

  try {
    const textArray = text.split('\n').filter((line) => line.trim() !== '');
    const response = await axios({
      method: 'post',
      url: baseUrl,
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        text: textArray,
        source_lang: 'ZH',
        target_lang: targetLang,
        preserve_formatting: true,
        split_sentences: 'nonewlines',
      },
    });

    const translations = response.data.translations.map(
      (translation: { text: string }, index: number) => ({
        src: textArray[index] || '',
        dst: translation.text,
      }),
    );

    return { trans_result: translations };
  } catch (error: any) {
    console.error('DeepL 翻译错误:', error.response?.data || error.message);
    return {
      error_code: String(error.response?.status || 'UNKNOWN_ERROR'),
      error_msg: error.response?.data?.message || error.message,
    } as TranslateResult;
  }
}
