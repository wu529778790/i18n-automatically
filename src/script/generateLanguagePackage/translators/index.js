const BaiduTranslator = require('./baiduTranslator.js');
const DeeplTranslator = require('./deeplTranslator.js');

const translators = {
  baidu: BaiduTranslator,
  deepl: DeeplTranslator,
};

function createTranslator(serviceName) {
  const Translator = translators[serviceName];
  if (!Translator) {
    throw new Error(`未找到 ${serviceName} 翻译服务`);
  }
  return new Translator();
}

module.exports = {
  createTranslator,
};
