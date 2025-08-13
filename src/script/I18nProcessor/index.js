const path = require('path');
const fs = require('fs');
const { TranslationManager } = require('./common');
const { handleVueFile } = require('./vueProcessor');
const { handleJsFile } = require('./jsProcessor');
const { readConfig } = require('../setting');
const prettier = require('prettier');

/**
 *
 * @param {string} fileExt
 * @returns
 */
function getParserForFile(fileExt) {
  switch (fileExt.toLowerCase()) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.vue':
      return 'vue';
    default:
      return 'babel'; // 默认使用 babel 解析器
  }
}
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
      // 通过 Prettier 官方 API 解析配置，避免打包后对用户工程的动态 require 失败
      let prettierConfig = await prettier
        .resolveConfig(filePath)
        .catch(() => null);

      let finalContent = contentChanged;
      try {
        // 优先格式化
        finalContent = await prettier.format(contentChanged, {
          parser: getParserForFile(fileExt),
          filepath: filePath, // 让 Prettier 感知文件类型
          ...prettierConfig,
        });
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
