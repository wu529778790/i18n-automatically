import axios from 'axios';
import * as crypto from 'crypto';
import { readConfig } from '../../setting';
import type { TranslateResult } from '../../../types';

function generateSign(
  appid: string,
  q: string,
  salt: number,
  secretKey: string,
): string {
  return crypto
    .createHash('md5')
    .update(appid + q + salt + secretKey)
    .digest('hex');
}

export async function baiduTranslateApi(
  q: string,
  language = 'en',
): Promise<TranslateResult | undefined> {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return undefined;
  }
  const { appid, secretKey } = config.baidu;
  const salt = new Date().getTime();
  const res = await axios({
    method: 'post',
    url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    params: {
      q,
      from: 'auto',
      to: language,
      appid,
      salt,
      sign: generateSign(appid, q, salt, secretKey),
    },
  });
  return res.data;
}
