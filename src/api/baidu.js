const axios = require("axios");
const md5 = require("md5");
const { getConfig } = require("../script/setting.js");

// 生成签名
const generateSign = (appid, q, salt, secretKey) => {
  return md5(appid + q + salt + secretKey);
};

exports.baiduTranslateApi = async (q, language = "en") => {
  const config = getConfig();
  if (!config) {
    console.log("未找到配置文件");
    return;
  }
  const { appid, secretKey } = config.baidu;
  const salt = new Date().getTime();
  const res = await axios({
    method: "post",
    url: "https://fanyi-api.baidu.com/api/trans/vip/translate",
    params: {
      q,
      from: "auto",
      to: language,
      appid,
      salt,
      sign: generateSign(appid, q, salt, secretKey),
    },
  });
  return res.data.trans_result;
};
