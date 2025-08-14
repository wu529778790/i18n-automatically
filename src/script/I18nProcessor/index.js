const path = require('path');
const fs = require('fs');
const { TranslationManager } = require('./common');
const { handleVueFile } = require('./vueProcessor');
const { handleJsFile } = require('./jsProcessor');
const { readConfig } = require('../setting');
// 使用 Prettier 核心库读取配置与格式化，行为与用户本地一致
const prettier = require('prettier');
// 无需 ESM 动态导入，优先处理 CommonJS 的 .prettierrc.js

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[timeout] ${label} exceeded ${ms}ms`));
      }, ms);
    }),
  ]).catch((e) => {
    console.warn(`[i18n-automatically] ${label} failed:`, e && e.message);
    return null;
  });
}

// （移除自定义解析器选择，交由 Prettier 依据 filepath 自动推断）
/**
 * 处理单个文件
 * @param {string} filePath 文件路径
 * @returns {Promise<void>}
 */
async function processFile(filePath) {
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
      /** @type {import('prettier').Options} */
      const defaultPrettierOptions = {};

      let finalContent = contentChanged;
      try {
        // 大文件直接跳过格式化，避免性能问题
        const isLarge = (finalContent && finalContent.length) > 200000;
        if (!isLarge) {
          // 读取用户 Prettier 配置（若存在），失败时忽略
          /** @type {import('prettier').Options | null} */
          let userPrettierOptions = await withTimeout(
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
              } catch (e) {
                console.warn(
                  '[i18n-automatically] load .prettierrc.js failed:',
                  e && e.message,
                );
              }
            }
          }

          // 构建最终格式化配置：
          // - 若 userPrettierOptions 存在：完全采用用户配置（仅补充 filepath 与 plugins）
          // - 若不存在：不提供我们自定义规则，走 Prettier 默认（仅提供 filepath 与 plugins）
          const baseOptions = userPrettierOptions || defaultPrettierOptions;
          const formattingOptions = {
            ...baseOptions,
            // 传入 filepath 便于按文件类型推断 parser，并让某些规则依据文件名生效
            filepath: filePath,
          };

          finalContent =
            (await withTimeout(
              prettier.format(contentChanged, formattingOptions),
              2000,
              'prettier.format',
            )) || contentChanged;
        }
      } catch (error) {
        // 若格式化失败，直接使用未格式化内容，避免阻断写入和翻译文件输出
        console.warn(
          `Prettier format failed for ${filePath}, fallback to raw content.`,
          error && error.message,
        );
      }

      try {
        await fs.promises.writeFile(filePath, finalContent, 'utf8');
      } catch (e) {
        console.error(`Write file failed for ${filePath}:`, e);
      }
      // 无论是否格式化/写入失败，尽量输出翻译文件，避免“扫描替换成功但 zh.json 为空”
      try {
        await outputTranslations(translations);
      } catch (e) {
        console.error(`Output translations failed for ${filePath}:`, e);
      }
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * 获取文件处理器
 * @param {string} fileExt 文件扩展名
 * @returns {Function|null} 文件处理器函数
 */
function getFileProcessor(fileExt) {
  const processors = {
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
 * @param {Map} translations 翻译映射
 * @returns {Promise<void>}
 */
async function outputTranslations(translations) {
  const translationManager = new TranslationManager();
  const config = readConfig();
  await translationManager.outputTranslationFile(translations, config);
}

/**
 * 递归处理目录中的所有文件
 * @param {string} dir 目录路径
 * @returns {Promise<void>}
 */
async function processDirectory(dir) {
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
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

/**
 * 主函数
 * @param {string} inputPath 输入路径（文件或目录）
 * @returns {Promise<void>}
 */
async function main(inputPath) {
  try {
    const stat = await fs.promises.stat(inputPath);
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else {
      await processFile(inputPath);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则处理命令行参数
if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Please provide a file or directory path as an argument.');
    process.exit(1);
  }

  main(inputPath).catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}

module.exports = { processFile, processDirectory, main };
