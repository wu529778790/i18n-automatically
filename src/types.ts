import type { Range, ThemeColor, TextEditorDecorationType } from 'vscode';

/** i18n 扩展配置 */
export interface I18nConfig {
  i18nFilePath: string;
  autoImportI18n: boolean;
  i18nImportPath: string;
  templateI18nCall: string;
  scriptI18nCall: string;
  keyFilePathLevel: number;
  excludeDebugContexts: boolean;
  excludedExtensions: string[];
  excludedStrings: string[];
  freeGoogle: boolean;
  baidu: {
    appid: string;
    secretKey: string;
  };
  deepl: {
    authKey: string;
    isPro: boolean;
  };
  useMd5Key: boolean;
  locale?: string;
  isAutoImportI18n?: boolean;
}

/** AST 处理上下文 */
export interface ProcessorContext {
  filePath: string;
  fileUuid: string;
  config: I18nConfig;
  index: number;
  translations: Map<string, string>;
  contentSource: string;
  contentChanged: string;
  ast: any | null;
  hasPluginImport?: boolean;
  templateSize?: number;
}

/** 文件处理器函数签名 */
export type FileProcessor = (
  filePath: string,
  config: I18nConfig,
) => Promise<ProcessorContext | undefined>;

/** AST 处理器函数签名 */
export type AstProcessor = (
  context: ProcessorContext,
  customContent?: string,
) => ProcessorContext | Promise<ProcessorContext | undefined>;

/** 翻译 API 返回的单条结果 */
export interface TranslateResultItem {
  src?: string;
  dst: string;
}

/** 翻译 API 返回结构 */
export interface TranslateResult {
  trans_result?: TranslateResultItem[];
  error_code?: string;
  error_msg?: string;
  error_type?: string;
  error?: string;
  suggestion?: string;
  original_error?: string;
  stack?: string;
}

/** 翻译器接口 */
export interface ITranslator {
  translate(
    texts: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null>;
}
