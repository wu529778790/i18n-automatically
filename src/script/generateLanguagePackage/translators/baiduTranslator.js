const vscode = require('vscode');
const { baiduTranslateApi } = require('../api/baidu.js');

class BaiduTranslator {
  async translate(text, language) {
    const data = await baiduTranslateApi(text, language);
    if (data.error_code) {
      vscode.window.showErrorMessage(
        `百度翻译失败，错误码：${data.error_code}，请打开百度翻译官网查看错误信息：https://api.fanyi.baidu.com/doc/21`,
      );
      return null;
    }
    return data.trans_result;
  }
}

module.exports = BaiduTranslator;
