const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { readConfig } = require('./setting.js');
const { scanChinese } = require('./scanChinese.js');

exports.scanChineseBatch = async () => {
  // 读取配置文件
  const config = readConfig(true);

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
      title: '正在批量扫描中文',
      cancellable: false,
    },
    async (progress) => {
      const totalSteps = 100; // 将总进度分为100步
      const filesPerStep = Math.max(1, Math.floor(fileCount / totalSteps));
      let processedCount = 0;
      let lastReportedStep = 0;

      for (const filePath of files) {
        await processFile(filePath);
        processedCount++;

        // 每处理 filesPerStep 个文件或达到最后一个文件时更新进度
        if (
          processedCount % filesPerStep === 0 ||
          processedCount === fileCount
        ) {
          const currentStep = Math.min(
            Math.floor((processedCount / fileCount) * totalSteps),
            totalSteps,
          );
          if (currentStep > lastReportedStep) {
            progress.report({ increment: currentStep - lastReportedStep });
            lastReportedStep = currentStep;
          }
        }
      }
    },
  );
};

function getAllFilesInFolder(folderPath, excludedExtensions) {
  const files = [];
  const entries = fs.readdirSync(folderPath);
  for (const item of entries) {
    const itemPath = path.join(folderPath, item);

    // 如果当前路径是 node_modules 文件夹，则跳过
    if (item === 'node_modules') {
      continue;
    }

    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      // 如果是文件夹，递归获取其中的文件
      files.push(...getAllFilesInFolder(itemPath, excludedExtensions));
    } else {
      const itemExtension = path.extname(item);
      if (!itemExtension) continue;
      if (excludedExtensions.includes(itemExtension)) continue;
      files.push(itemPath);
    }
  }
  return files;
}

async function processFile(filePath) {
  // 仅处理受支持的代码后缀
  const support = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);
  const ext = path.extname(filePath).toLowerCase();
  if (!support.has(ext)) return;
  await scanChinese(filePath);
}
