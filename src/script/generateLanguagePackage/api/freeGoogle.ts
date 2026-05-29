import { translate } from '@vitalets/google-translate-api';
import type { TranslateResult } from '../../../../types';

export async function googleTranslateApi(
  q: string,
  language = 'en',
): Promise<TranslateResult> {
  try {
    const { text } = await translate(q, { to: language });
    return {
      trans_result: [{ dst: text }],
    };
  } catch (error: any) {
    console.error('Google translate error:', error);

    if (error.name === 'TooManyRequestsError') {
      return {
        error_code: '429',
        error_msg: '免费谷歌翻译请求频率超限，请稍后重试',
        error_type: 'RATE_LIMIT',
        original_error: error.message,
      } as TranslateResult;
    }

    return {
      error_code: '500',
      error_msg: '免费谷歌翻译服务异常',
      error_type: error.name || 'UNKNOWN_ERROR',
      original_error: error.message,
      stack: error.stack,
    } as TranslateResult;
  }
}
