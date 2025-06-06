const { translate } = require('@vitalets/google-translate-api');

exports.googleTranslateApi = async (q, language = 'en') => {
  try {
    const { text } = await translate(q, { to: language });
    return {
      trans_result: [{ dst: text }],
    };
  } catch (error) {
    console.error(error);
    return {
      error_code: '500',
      error_msg: 'Google translate error',
      error: error,
    };
  }
};
