const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { getConfig } = require("./setting.js");
const { scanChinese } = require("./scanChinese/index.js");

exports.scanChineseBatch = async () => {
  // 读取配置文件
  const config = getConfig(true);

  // 调用 vscode API 打开文件夹选择对话框
  const folder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });

  // 如果用户没有选择文件夹，返回
  if (!folder || folder.length === 0) {
    return;
  }

  const folderPath = folder[0].fsPath;

  // 定义要过滤的后缀名数组
  const excludedExtensions = [...config.excludedExtensions];

  // 获取所有符合条件的文件
  const files = getAllFilesInFolder(folderPath, excludedExtensions);
  const fileCount = files.length;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "正在批量扫描中文",
      cancellable: false,
    },
    async (progress) => {
      let processedCount = 0;
      for (const filePath of files) {
        await processFile(filePath);
        processedCount++;
        const progressPercentage = (processedCount / fileCount) * 100;
        progress.report({ increment: progressPercentage });
      }
    }
  );
};

function getAllFilesInFolder(folderPath, excludedExtensions) {
  const files = [];
  const items = fs.readdirSync(folderPath).filter((item) => {
    const itemExtension = path.extname(item);
    return !excludedExtensions.includes(itemExtension);
  });
  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      // 如果是文件夹，递归获取其中的文件
      files.push(...getAllFilesInFolder(itemPath, excludedExtensions));
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

async function processFile(filePath) {
  // 这里可以调用你的文件处理逻辑，比如 scanChinese 函数处理单个文件
  await scanChinese(filePath);
}
