import { BaiduTranslator } from './baiduTranslator';
import { DeeplTranslator } from './deeplTranslator';
import { GoogleTranslator } from './googleTranslator';
import type { ITranslator } from '../../../../types';

const translators: Record<string, new () => ITranslator> = {
  baidu: BaiduTranslator,
  deepl: DeeplTranslator,
  freeGoogle: GoogleTranslator,
};

export function createTranslator(serviceName: string): ITranslator {
  const Translator = translators[serviceName];
  if (!Translator) {
    throw new Error(`未找到 ${serviceName} 翻译服务`);
  }
  return new Translator();
}
