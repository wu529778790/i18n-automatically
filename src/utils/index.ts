import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** 生成唯一 ID */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
}

/** 保存对象到指定路径 */
export function saveObjectToPath(
  obj: Record<string, unknown>,
  filePath: string,
): Promise<void> {
  const rootPath = getRootPath();
  const newFilePath = path.join(rootPath, filePath);
  const directory = path.dirname(newFilePath);

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let updatedContent: Record<string, unknown> = { ...obj };

    if (fs.existsSync(newFilePath)) {
      try {
        const fileContent = fs.readFileSync(newFilePath, 'utf-8');
        const fileContentObj: Record<string, unknown> = fileContent
          ? JSON.parse(fileContent)
          : {};
        updatedContent = { ...fileContentObj, ...obj };
      } catch (_error) {
        reject(`Error reading or parsing file: ${newFilePath}`);
        return;
      }
    }

    try {
      fs.writeFileSync(
        newFilePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
      resolve();
    } catch (_error) {
      reject(`Error writing file: ${newFilePath}`);
    }
  });
}

/** 获取工作区根目录 */
export function getRootPath(): string {
  return vscode.workspace.workspaceFolders![0].uri.fsPath;
}
