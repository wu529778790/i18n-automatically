const axios = require('axios');
const { readConfig } = require('../../setting.js');

exports.deeplTranslateApi = async (text, targetLanguage = 'en') => {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return { error: '未找到配置文件' };
  }

  const { authKey, isPro } = config.deepl;
  if (!authKey) {
    console.error('未配置 DeepL 认证密钥');
    return { error: '未配置 DeepL 认证密钥' };
  }

  // 直接使用官方 DeepL 语言代码
  const targetLang = targetLanguage.toUpperCase();

  // 根据是否为专业版选择 API 端点
  const baseUrl = isPro
    ? 'https://api.deepl.com/v2/translate'
    : 'https://api-free.deepl.com/v2/translate';

  try {
    // 将多行文本分割成数组进行处理
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

    // 转换为类似百度翻译的响应格式
    const translations = response.data.translations.map(
      (translation, index) => ({
        src: textArray[index] || '',
        dst: translation.text,
      }),
    );

    return {
      trans_result: translations,
    };
  } catch (error) {
    console.error(
      'DeepL 翻译错误:',
      (error.response && error.response.data) || error.message,
    );
    return {
      error_code: (error.response && error.response.status) || 'UNKNOWN_ERROR',
      error_msg:
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message,
    };
  }
};
