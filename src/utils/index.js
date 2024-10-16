const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * 生成唯一ID
 */
exports.generateUniqueId = () => {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
};

// 保存对象到指定路径的方法
exports.saveObjectToPath = (obj, filePath) => {
  const rootPath = this.getRootPath();
  const newFilePath = path.join(rootPath, filePath);
  const directory = path.dirname(newFilePath);

  return new Promise((resolve, reject) => {
    // 创建目录（如果不存在）
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let updatedContent = obj;

    // 尝试读取文件内容并合并
    if (fs.existsSync(newFilePath)) {
      try {
        const fileContent = fs.readFileSync(newFilePath, 'utf-8');
        const fileContentObj = fileContent ? JSON.parse(fileContent) : {};
        updatedContent = { ...fileContentObj, ...obj };
      } catch (error) {
        reject(`Error reading or parsing file: ${newFilePath}`);
      }
    }

    // 写入更新后的内容
    try {
      fs.writeFileSync(
        newFilePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
      resolve();
    } catch (error) {
      reject(`Error writing file: ${newFilePath}`);
    }
  });
};

/**
 * 获取根目录
 */
exports.getRootPath = () => {
  return vscode.workspace.workspaceFolders[0].uri.fsPath;
};
