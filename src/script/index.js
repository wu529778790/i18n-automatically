const { setting, readConfig } = require('./setting.js');
const { scanChinese } = require('./scanChinese.js');
const { scanChineseBatch } = require('./scanChineseBatch.js');
const { switchLanguage, updateDecorations } = require('./switchLanguage.js');
const { generateLanguagePackage } = require('./generateLanguagePackage.js');

module.exports = {
  setting,
  readConfig,
  scanChinese,
  scanChineseBatch,
  switchLanguage,
  updateDecorations,
  generateLanguagePackage,
};
