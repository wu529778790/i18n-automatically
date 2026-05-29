import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import generate from '@babel/generator';
import * as vscode from 'vscode';
import { generateUniqueId } from '../../utils';
import { readConfig } from '../setting';
import type {
  I18nConfig,
  ProcessorContext,
  AstProcessor,
  FileProcessor,
} from '../../../types';

/** 创建处理上下文 */
export function createContext(
  filePath: string,
  config: I18nConfig,
): ProcessorContext {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config: {
      ...config,
      isAutoImportI18n: true,
      excludeDebugContexts:
        config && 'excludeDebugContexts' in config
          ? config.excludeDebugContexts
          : true,
    },
    index: 0,
    translations: new Map(),
    contentSource: (() => {
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
          throw new Error(`Not a file: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf-8');
      } catch (e: any) {
        console.error('[i18n-automatically] read source failed:', e.message);
        return '';
      }
    })(),
    contentChanged: '',
    ast: null,
  };
}

/** 创建 I18n 处理器（高阶函数） */
export function createI18nProcessor(
  astProcessor: AstProcessor,
): FileProcessor {
  return function (filePath: string, config: I18nConfig) {
    const context = createContext(filePath, config);
    return astProcessor(context) as any;
  };
}

/** 生成 i18n key */
export function generateKey(context: ProcessorContext, text = ''): string {
  const { filePath, fileUuid, config } = context;

  if (config.useMd5Key && text) {
    context.index++;
    return crypto.createHash('md5').update(text.trim()).digest('hex');
  }

  const pathParts = filePath.split(path.sep);
  const pathDeep = config.keyFilePathLevel || 2;
  const selectedLevelsParts = pathParts.slice(-pathDeep);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split('.')[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join('-');
  context.index++;
  return `${selectedLevels}-${fileUuid}-${context.index}`;
}

/** 使用 Babel generator 从 AST 生成代码 */
export function generateCode(ast: any, content: string): string {
  const opts = {
    retainLines: true,
    jsonCompatibleStrings: true,
    flowCommaSeparator: true,
    quotes: 'single' as const,
    jsescOption: {
      wrap: true,
    },
  };
  return generate(ast, opts, content).code;
}

/** 检查字符串是否包含 DOM 标签 */
export function stringWithDom(str: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}

/** 检查字符串是否包含中文 */
export function containsChinese(str: string, isExcluded = false): boolean {
  const chineseRegex = /[一-龥]/;
  if (!chineseRegex.test(str)) {
    return false;
  }

  const imageExtensionRegex =
    /\.(png|jpe?g|gif|svg|webp)(['"]|\?[^'"\s]*)?$/i;
  if (imageExtensionRegex.test(str)) {
    return false;
  }

  if (!isExcluded) {
    const config = readConfig();
    if (
      Array.isArray(config?.excludedStrings) &&
      config!.excludedStrings!.length
    ) {
      const isExcludedByConfig = config!.excludedStrings!.includes(str.trim());
      if (isExcludedByConfig) {
        return false;
      }
    }
  }

  return true;
}

/** 翻译文件管理器 */
export class TranslationManager {
  private getRootPath(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders[0] && workspaceFolders[0].uri) {
      return workspaceFolders[0].uri.fsPath || '';
    }
    return '';
  }

  /** 将翻译对象保存到 JSON 文件 */
  outputTranslationFile(
    translations: Map<string, string> | Record<string, string>,
    config: I18nConfig,
  ): void {
    const rootPath = this.getRootPath();
    const locale = config.locale || 'zh';

    const isWin = process.platform === 'win32';
    const configuredRaw = config.i18nFilePath || 'src/i18n';
    const looksUnixRootOnWin =
      isWin &&
      /^[\\/]+/.test(configuredRaw) &&
      !/^[a-zA-Z]:[\\/]/.test(configuredRaw);
    const normalizedConfigured = looksUnixRootOnWin
      ? configuredRaw.replace(/^[\\/]+/, '')
      : configuredRaw;

    const appearsAbsoluteUnix =
      !isWin && /^[\\/]+/.test(normalizedConfigured);

    let baseDir: string;
    if (path.isAbsolute(normalizedConfigured)) {
      if (!normalizedConfigured.startsWith(rootPath) && appearsAbsoluteUnix) {
        baseDir = path.join(
          rootPath,
          normalizedConfigured.replace(/^[\\/]+/, ''),
        );
      } else {
        baseDir = normalizedConfigured;
      }
    } else {
      baseDir = path.join(rootPath, normalizedConfigured);
    }

    if (path.basename(baseDir).toLowerCase() === 'locale') {
      baseDir = path.dirname(baseDir);
    }
    if (/\.json$/i.test(baseDir)) {
      baseDir = path.dirname(baseDir);
    }

    const targetDir = path.join(baseDir, 'locale');
    const filePath = path.join(targetDir, `${locale}.json`);

    const translationObj: Record<string, string> =
      translations instanceof Map
        ? Object.fromEntries(translations)
        : translations;

    try {
      fs.mkdirSync(targetDir, { recursive: true });

      let updatedContent = translationObj;

      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          throw new Error(
            `Expected a file but found a directory at: ${filePath}. Please remove this directory or fix i18nFilePath.`,
          );
        }
        try {
          const fileContent = fs.readFileSync(filePath, {
            encoding: 'utf-8',
            flag: 'r',
          });
          if (fileContent.trim()) {
            const fileContentObj = JSON.parse(fileContent);
            updatedContent = { ...fileContentObj, ...translationObj };
          } else {
            updatedContent = { ...translationObj };
          }
        } catch (error: any) {
          throw new Error(
            `Error reading or parsing file: ${filePath}. ${error.message}`,
          );
        }
      }

      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
    } catch (error: any) {
      console.error(`Failed to output translation file: ${error.message}`);
      throw error;
    }
  }
}
