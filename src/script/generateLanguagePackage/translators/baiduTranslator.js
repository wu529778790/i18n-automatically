const vscode = require('vscode');
const { baiduTranslateApi } = require('../api/baidu.js');

class BaiduTranslator {
  async translate(arr, language) {
    // 百度翻译只支持单个请求，所以需要将数组中的每个元素拼接成一个字符串
    const text = arr.join('\n');
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
