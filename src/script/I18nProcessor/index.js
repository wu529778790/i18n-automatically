const path = require("path");
const fs = require("fs").promises;
const { TranslationManager, readConfig, logger } = require("./common");
const handleVueFile = require("./vueProcessor");
const { handleJsFile } = require("./jsProcessor");

const config = readConfig();

/**
 * 处理单个文件
 * @param {string} filePath 文件路径
 * @returns {Promise<void>}
 */
async function processFile(filePath) {
  // 后缀名
  const fileExt = path.extname(filePath).toLowerCase();
  // 文件处理器
  const processor = getFileProcessor(fileExt);

  if (!processor) {
    logger.info(`不支持的文件类型: ${fileExt}`);
    return;
  }

  try {
    const { translations, contentChanged } = await processor(filePath, config);
    if (contentChanged) {
      await fs.writeFile(filePath, contentChanged, "utf-8");
      await outputTranslations(translations);
      logger.info(`Processed and updated: ${filePath}`);
    } else {
      logger.info(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * 获取文件处理器
 * @param {string} fileExt 文件扩展名
 * @returns {Function|null} 文件处理器函数
 */
function getFileProcessor(fileExt) {
  const processors = {
    ".vue": handleVueFile,
    ".js": handleJsFile,
    ".jsx": handleJsFile,
    ".ts": handleJsFile,
    ".tsx": handleJsFile,
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
    logger.error(`Error processing directory ${dir}:`, error);
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
    logger.info("Processing completed.");
  } catch (error) {
    logger.error("An error occurred:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则处理命令行参数
if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    logger.error("Please provide a file or directory path as an argument.");
    process.exit(1);
  }

  main(inputPath).catch((error) => {
    logger.error("An error occurred:", error);
    process.exit(1);
  });
}

module.exports = { processFile, processDirectory, main };
