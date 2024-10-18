const path = require('path');
const fs = require('fs');
const { TranslationManager } = require('./common');
const { handleVueFile } = require('./vueProcessor');
const { handleJsFile } = require('./jsProcessor');
const { readConfig } = require('../setting');
const prettier = require('prettier');
const { getRootPath } = require('../../utils/index');
const customConsole = require('../../utils/customConsole.js');

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
    const config = readConfig();
    const processResult = await processor(filePath, config);
    const { contentChanged, translations } = processResult || {};
    if (contentChanged) {
      // 判断项目根目录是否有.prettierrc.js
      let prettierConfig = null;
      const prettierConfigPath = path.join(getRootPath(), '.prettierrc.js');
      if (fs.existsSync(prettierConfigPath)) {
        prettierConfig = require(prettierConfigPath);
      }
      try {
        //格式化代码
        const formatContent = await prettier.format(contentChanged, {
          parser: getParserForFile(fileExt),
          ...prettierConfig,
        });
        await fs.promises.writeFile(filePath, formatContent, 'utf8');
        await outputTranslations(translations);
        customConsole.log(`Processed and updated: ${filePath}`);
      } catch (error) {
        customConsole.error(prettierConfig, contentChanged);
        customConsole.error(`Error processing file ${filePath}:`, error);
      }
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
  return processors[fileExt] || handleJsFile;
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
    const stat = await fs.promises.stat(inputPath);
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
