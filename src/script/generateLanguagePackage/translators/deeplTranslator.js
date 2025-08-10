const vscode = require('vscode');
const { deeplTranslateApi } = require('../api/deepl.js');

class DeeplTranslator {
  async translate(arr, language) {
    const text = Array.isArray(arr) ? arr.join('\n') : String(arr || '');
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
