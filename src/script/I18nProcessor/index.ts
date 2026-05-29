import * as path from 'path';
import * as fs from 'fs';
import { TranslationManager } from './common';
import { handleVueFile } from './vueProcessor';
import { handleJsFile } from './jsProcessor';
import { readConfig } from '../setting';
// 使用 Prettier 核心库读取配置与格式化，行为与用户本地一致
import * as prettier from 'prettier';
// 无需 ESM 动态导入，优先处理 CommonJS 的 .prettierrc.js

import type { ProcessorContext, I18nConfig } from '../../types';

/** 文件处理器函数签名 */
type FileProcessorFn = (
  filePath: string,
  config: I18nConfig,
) => Promise<ProcessorContext | undefined>;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[timeout] ${label} exceeded ${ms}ms`));
      }, ms);
    }),
  ]).catch((e: unknown) => {
    console.warn(`[i18n-automatically] ${label} failed:`, e instanceof Error ? e.message : String(e));
    return null;
  });
}

// （移除自定义解析器选择，交由 Prettier 依据 filepath 自动推断）
/**
 * 处理单个文件
 * @param filePath 文件路径
 */
async function processFile(filePath: string): Promise<void> {
  const fileExt = path.extname(filePath).toLowerCase();
  const processor = getFileProcessor(fileExt);

  if (!processor) {
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      console.warn(`[i18n-automatically] skip non-file path: ${filePath}`);
      return;
    }
    const config = readConfig();
    const processResult = await processor(filePath, config);
    const { contentChanged, translations } = processResult || {};
    if (contentChanged) {
      // 不合并：若用户配置存在，完全使用用户配置；否则走 Prettier 默认
      const defaultPrettierOptions: prettier.Options = {};

      // 备用：在无法使用 prettier 核心（如浏览器/某些宿主环境）时，回退到 standalone
      function getParserForFile(ext: string): string {
        switch ((ext || '').toLowerCase()) {
          case '.ts':
          case '.tsx':
            return 'typescript';
          case '.vue':
            return 'vue';
          case '.jsx':
          case '.js':
            return 'babel';
          default:
            return 'babel';
        }
      }

      let finalContent: string = contentChanged;
      try {
        // 大文件直接跳过格式化，避免性能问题
        const isLarge = (finalContent && finalContent.length) > 200000;
        if (!isLarge) {
          // 读取用户 Prettier 配置（若存在），失败时忽略
          let userPrettierOptions: prettier.Options | null = await withTimeout(
            prettier.resolveConfig(filePath, { editorconfig: true }),
            1200,
            'prettier.resolveConfig',
          );

          // 兼容某些环境下 .prettierrc.js 未被 resolveConfig 识别的情况：手动定位并加载
          if (!userPrettierOptions) {
            const configFile = await withTimeout(
              prettier.resolveConfigFile(filePath),
              800,
              'prettier.resolveConfigFile',
            );
            if (configFile && /\.(c?js|mjs)$/i.test(configFile)) {
              try {
                // 优先 require（CommonJS）.prettierrc.js
                const loaded = require(configFile);
                if (loaded && typeof loaded === 'object') {
                  userPrettierOptions = loaded;
                }
              } catch (e: unknown) {
                console.warn(
                  '[i18n-automatically] load .prettierrc.js failed:',
                  e instanceof Error ? e.message : String(e),
                );
              }
            }
          }

          // 构建最终格式化配置：
          // - 若 userPrettierOptions 存在：完全采用用户配置（仅补充 filepath 与 plugins）
          // - 若不存在：不提供我们自定义规则，走 Prettier 默认（仅提供 filepath 与 plugins）
          const baseOptions = userPrettierOptions || defaultPrettierOptions;
          const formattingOptions: prettier.Options = {
            ...baseOptions,
            // 传入 filepath 便于按文件类型推断 parser，并让某些规则依据文件名生效
            filepath: filePath,
          };

          let formatted: string | null = await withTimeout(
            prettier.format(contentChanged, formattingOptions),
            2000,
            'prettier.format',
          );

          if (!formatted) {
            try {
              // 回退到 standalone：不传入 host-only 选项，显式指定 parser 与 plugins
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const prettierStandalone = require('prettier/standalone');
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const pBabel = require('prettier/plugins/babel');
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const pHtml = require('prettier/plugins/html');
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const pTs = require('prettier/plugins/typescript');
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              const pEstree = require('prettier/plugins/estree');

              const standaloneOptions = { ...(baseOptions || {}) } as Record<string, unknown>;
              delete standaloneOptions.filepath;
              delete standaloneOptions.pluginSearchDirs;
              delete standaloneOptions.config;
              delete standaloneOptions.configFile;
              delete standaloneOptions.ignorePath;

              formatted = await withTimeout(
                prettierStandalone.format(contentChanged, {
                  ...standaloneOptions,
                  parser: getParserForFile(fileExt),
                  plugins: [pBabel, pHtml, pTs, pEstree],
                }),
                2000,
                'prettier.standalone.format',
              );
            } catch (_e) {
              // 忽略，保持 formatted 为空以便回退原文
            }
          }

          finalContent = formatted || contentChanged;
        }
      } catch (error: unknown) {
        // 若格式化失败，直接使用未格式化内容，避免阻断写入和翻译文件输出
        console.warn(
          `Prettier format failed for ${filePath}, fallback to raw content.`,
          error instanceof Error ? error.message : String(error),
        );
      }

      try {
        await fs.promises.writeFile(filePath, finalContent, 'utf8');
      } catch (e: unknown) {
        console.error(`Write file failed for ${filePath}:`, e);
      }
      // 无论是否格式化/写入失败，尽量输出翻译文件，避免"扫描替换成功但 zh.json 为空"
      try {
        await outputTranslations(translations);
      } catch (e: unknown) {
        console.error(`Output translations failed for ${filePath}:`, e);
      }
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
  } catch (error: unknown) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * 获取文件处理器
 * @param fileExt 文件扩展名
 */
function getFileProcessor(fileExt: string): FileProcessorFn | null {
  const processors: Record<string, FileProcessorFn> = {
    '.vue': handleVueFile,
    '.js': handleJsFile,
    '.jsx': handleJsFile,
    '.ts': handleJsFile,
    '.tsx': handleJsFile,
  };
  // 仅支持上述代码类型，其余（如 .html/.md/.json 等）不处理
  return processors[fileExt] || null;
}

/**
 * 输出翻译文件
 * @param translations 翻译映射
 */
async function outputTranslations(
  translations: Map<string, string> | undefined,
): Promise<void> {
  const translationManager = new TranslationManager();
  const config = readConfig();
  await translationManager.outputTranslationFile(translations, config);
}

/**
 * 递归处理目录中的所有文件
 * @param dir 目录路径
 */
async function processDirectory(dir: string): Promise<void> {
  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else {
        await processFile(filePath);
      }
    }
  } catch (error: unknown) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

/**
 * 主函数
 * @param inputPath 输入路径（文件或目录）
 */
async function main(inputPath: string): Promise<void> {
  try {
    const stat = await fs.promises.stat(inputPath);
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else {
      await processFile(inputPath);
    }
  } catch (error: unknown) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

export { processFile, processDirectory, main };
