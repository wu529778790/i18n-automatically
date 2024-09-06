const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/**
 * 生成唯一ID
 */
exports.generateUniqueId = () => {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
};

/**
 * 检查Script标签中是否存在于另一个字符串的注释中
 *
 * @param {string} content - 要检查的原始字符串，其中可能包含注释
 * @param {string} target - 要在注释中查找的目标字符串
 * @return {boolean} 如果目标字符串存在于注释中，返回 true；否则返回 false
 */
exports.isInScriptComment = (content, target) => {
  const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g;
  const comments = content.match(commentRegex) || [];
  for (const comment of comments) {
    if (comment.includes(target)) {
      return true;
    }
  }
  return false;
};

/**
 * 检查Template标签中是否存在于模板字符串的注释中
 *
 * @param {string} templateContent - 要检查的模板字符串，其中可能包含注释
 * @param {string} target - 要在注释中查找的目标字符串
 * @return {boolean} 如果目标字符串存在于注释中，返回 true；否则返回 false
 */
exports.isInTemplateComment = (templateContent, target) => {
  const commentRegex = /<!--[\s\S]*?-->/g;
  const comments = templateContent.match(commentRegex) || [];
  for (const comment of comments) {
    if (comment.includes(target)) {
      return true;
    }
  }
  return false;
};

/**
 *
 * @param {*} text
 * @param {*} chineseMatch
 * @returns
 */
exports.isInTemplate = (text, chineseMatch) => {
  // 将输入的文本按行分割成数组
  const lines = text.split("\n");
  // 用于存储已遇到的模板开始标签，以判断嵌套层次
  const templateStack = [];
  // 标志当前是否在模板区域内
  let inTemplate = false;
  // 标志是否正在检查潜在的模板开始标签
  let potentialStartTag = false;
  // 标志是否正在检查潜在的模板结束标签
  let potentialEndTag = false;

  for (const line of lines) {
    // 检查该行是否为潜在的模板开始标签
    checkPotentialStartTag(line);
    // 检查该行是否为潜在的模板结束标签
    checkPotentialEndTag(line);

    // 如果当前处于模板区域内且该行包含给定的中文匹配字符串，则返回 true
    if (inTemplate && line.includes(chineseMatch)) {
      return true;
    }
  }

  // 如果遍历完所有行都没有找到匹配，则返回 false
  return false;

  // 检查潜在开始标签的函数
  function checkPotentialStartTag(line) {
    // 如果当前没有正在检查潜在开始标签且该行包含'<template'
    if (!potentialStartTag && line.includes("<template")) {
      potentialStartTag = true;
    }
    // 如果正在检查潜在开始标签
    if (potentialStartTag) {
      // 在该行中查找'>'字符的位置，从'<template'之后开始查找
      const endBracketIndex = line.indexOf(">", line.indexOf("<template"));
      // 如果找到了'>'，表示找到了完整的模板开始标签
      if (endBracketIndex !== -1) {
        // 将完整的模板开始标签存入栈中
        templateStack.push(
          line.substring(line.indexOf("<template"), endBracketIndex + 1)
        );
        // 设置当前处于模板区域内标志为真
        inTemplate = true;
        // 重置潜在开始标签标志为假
        potentialStartTag = false;
      }
    }
  }

  // 检查潜在结束标签的函数
  function checkPotentialEndTag(line) {
    // 如果当前没有正在检查潜在结束标签且该行包含'</template>'
    if (!potentialEndTag && line.includes("</template>")) {
      potentialEndTag = true;
    }
    // 如果正在检查潜在结束标签
    if (potentialEndTag) {
      // 判断栈顶的开始标签是否包含给定的潜在结束标签
      if (
        templateStack.length > 0 &&
        stackTopIncludesEndTag(
          templateStack[templateStack.length - 1],
          line,
          line.indexOf("</template>")
        )
      ) {
        // 如果构建的潜在结束标签与栈顶的开始标签匹配，则弹出栈顶元素
        templateStack.pop();
        // 如果栈为空，表示退出了所有的模板区域，设置在模板区域内标志为假
        if (templateStack.length === 0) {
          inTemplate = false;
        }
        // 重置潜在结束标签标志为假
        potentialEndTag = false;
      }
    }
  }

  // 判断栈顶的开始标签是否包含给定的潜在结束标签
  function stackTopIncludesEndTag(stackTop, line, endTagIndex) {
    return stackTop.includes(
      line.substring(endTagIndex - stackTop.length, endTagIndex)
    );
  }
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
        const fileContent = fs.readFileSync(newFilePath, "utf-8");
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
        "utf-8"
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

// 导出一个名为 customLog 的函数，用于有条件地记录日志
exports.customLog = (debug, ...args) => {
  // 如果 debug 参数为真，即开发模式下
  if (debug) {
    // 则使用 console.log 方法将 args 参数中的所有内容输出到控制台
    console.log(...args);
  }
};
