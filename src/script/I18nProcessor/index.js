const path = require('path');
const fs = require('fs').promises;
const { TranslationManager, customConsole } = require('./common');
const handleVueFile = require('./vueProcessor');
const { handleJsFile } = require('./jsProcessor');
const { readConfig } = require('../setting');
const prettier = require('prettier');

//缓存配置数据
const config = readConfig();
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
    customConsole.log(`Unsupported file type: ${fileExt}`);
    return;
  }

  try {
    const processResult = await processor(filePath, config);
    const { contentChanged, translations } = processResult || {};
    if (contentChanged) {
      // try {
      //格式化代码
      const formatContent = await prettier.format(contentChanged, {
        parser: getParserForFile(fileExt),
        printWidth: 120,
        semi: false,
        singleQuote: true,
        arrowParens: 'avoid',
        trailingComma: 'none',
        endOfLine: 'auto',
      });
      await fs.writeFile(filePath, formatContent, 'utf-8');
      // } catch (e) {
      //   console.log('format出错', e);
      //   await fs.writeFile(filePath, contentChanged, 'utf-8');
      // }

      await outputTranslations(translations);
      customConsole.log(`Processed and updated: ${filePath}`);
    } else {
      customConsole.log(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    customConsole.error(`Error processing file ${filePath}:`, error);
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
  return processors[fileExt] || null;
}

/**
 * 输出翻译文件
 * @param {Map} translations 翻译映射
 * @returns {Promise<void>}
 */
async function outputTranslations(translations) {
  const translationManager = new TranslationManager();
  // const config = readConfig();
  await translationManager.outputTranslationFile(translations, config);
}

/**
 * 递归处理目录中的所有文件
 * @param {string} dir 目录路径
 * @returns {Promise<void>}
 */
async function processDirectory(dir) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else {
        await processFile(filePath);
      }
    }
  } catch (error) {
    customConsole.error(`Error processing directory ${dir}:`, error);
  }
}

/**
 * 主函数
 * @param {string} inputPath 输入路径（文件或目录）
 * @returns {Promise<void>}
 */
async function main(inputPath) {
  try {
    const stat = await fs.stat(inputPath);
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else {
      await processFile(inputPath);
    }
    customConsole.log('Processing completed.');
  } catch (error) {
    customConsole.error('An error occurred:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则处理命令行参数
if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    customConsole.error(
      'Please provide a file or directory path as an argument.',
    );
    process.exit(1);
  }

  main(inputPath).catch((error) => {
    customConsole.error('An error occurred:', error);
    process.exit(1);
  });
}

module.exports = { processFile, processDirectory, main };
