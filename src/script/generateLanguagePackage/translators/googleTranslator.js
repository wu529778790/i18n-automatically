const vscode = require('vscode');
const { googleTranslateApi } = require('../api/freeGoogle.js');

class GoogleTranslator {
  async translate(arr, language) {
    const trans_result = [];
    for (const text of arr) {
      const data = await googleTranslateApi(text, language);
      if (data.error_code) {
        vscode.window.showErrorMessage(
          `免费谷歌翻译失败，错误码：${data.error_code}，请稍后重试`,
        );
        trans_result.push({ dst: '' });
      } else {
        trans_result.push(data.trans_result[0]);
      }
    }
    return trans_result;
  }
}

module.exports = GoogleTranslator;
