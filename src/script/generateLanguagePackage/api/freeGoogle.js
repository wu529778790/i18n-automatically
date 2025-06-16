const { translate } = require('@vitalets/google-translate-api');

exports.googleTranslateApi = async (q, language = 'en') => {
  try {
    const { text } = await translate(q, { to: language });
    return {
      trans_result: [{ dst: text }],
    };
  } catch (error) {
    console.error('Google translate error:', error);

    // 根据错误类型返回不同的错误信息
    if (error.name === 'TooManyRequestsError') {
      return {
        error_code: '429',
        error_msg: '免费谷歌翻译请求频率超限，请稍后重试',
        error_type: 'RATE_LIMIT',
        suggestion: '建议降低翻译频率或使用其他翻译服务',
        original_error: error.message,
      };
    }

    // 其他类型的错误
    return {
      error_code: '500',
      error_msg: '免费谷歌翻译服务异常',
      error_type: error.name || 'UNKNOWN_ERROR',
      original_error: error.message,
      stack: error.stack,
    };
  }
};
