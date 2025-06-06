const vscode = require('vscode');
const { deeplTranslateApi } = require('../api/deepl.js');

class DeeplTranslator {
  async translate(text, language) {
    const data = await deeplTranslateApi(text, language);
    if (data.error_code || data.error) {
      vscode.window.showErrorMessage(
        `DeepL 翻译失败：${data.error_msg || data.error}`,
      );
      return null;
    }
    return data.trans_result;
  }
}

module.exports = DeeplTranslator;
