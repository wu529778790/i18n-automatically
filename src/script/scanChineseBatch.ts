import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { readConfig } from './setting';
import { scanChinese } from './scanChinese';

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);

/** 批量扫描文件夹中的中文 */
export async function scanChineseBatch(): Promise<void> {
  const config = readConfig(true);
  if (!config) return;

  const folder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });

  if (!folder || folder.length === 0) return;

  const folderPath = folder[0].fsPath;
  const excludedExtensions = [...config.excludedExtensions];
  const files = getAllFilesInFolder(folderPath, excludedExtensions);
  const fileCount = files.length;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: '正在批量扫描中文',
      cancellable: false,
    },
    async (progress) => {
      const totalSteps = 100;
      const filesPerStep = Math.max(1, Math.floor(fileCount / totalSteps));
      let processedCount = 0;
      let lastReportedStep = 0;

      for (const filePath of files) {
        await processFile(filePath);
        processedCount++;

        if (processedCount % filesPerStep === 0 || processedCount === fileCount) {
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
}

function getAllFilesInFolder(folderPath: string, excludedExtensions: string[]): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(folderPath);
  for (const item of entries) {
    const itemPath = path.join(folderPath, item);
    if (item === 'node_modules') continue;
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
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

async function processFile(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return;
  await scanChinese(filePath);
}
