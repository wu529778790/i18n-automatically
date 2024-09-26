const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { parse: parseSfc } = require('@vue/compiler-sfc');
const {
  parse: parseTemplate,
  // compile: compileDom,
  // generate: generateDom,
} = require('@vue/compiler-dom');
const { parse: babelParse } = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
// const { default: generate } = require("@babel/generator");
const { getConfig } = require('./setting.js');
const { updateDecorations } = require('./switchLanguage.js');
const {
  generateUniqueId,
  saveObjectToPath,
  customLog,
} = require('../utils/index.js');
const chineseRegex = /[\u4e00-\u9fa5]/;
let chineseTexts = new Map();
let index = 0;
let hasI18nUsageInScript = false;
let hasI18nUsageInScriptSetup = false;

/**
 * 收集中文文本
 * @param {string} fileUuid 文件 UUID
 * @param {string} content 文件内容
 */
const collectChineseText = (fileUuid, content) => {
  if (typeof content !== 'string') {
    return;
  }
  content = content.trim();
  if (content && !chineseTexts.has(fileUuid)) {
    chineseTexts.set(fileUuid, content);
  }
};

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>}
 */
const readFileContent = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`无法读取文件 ${filePath}: ${error.message}`);
  }
};

/**
 * 保存文件内容
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @returns {Promise<void>}
 */
const saveFileContent = async (filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`无法保存文件 ${filePath}: ${error.message}`);
  }
};

/**
 * 生成唯一的 UUID
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {number} index 索引
 * @param {object} config 配置
 * @returns {string}
 */
const generateUUID = (filePath, fileUuid, index, config) => {
  const pathParts = filePath.split(path.sep);
  const selectedLevelsParts = pathParts.slice(-config.keyFilePathLevel);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split('.')[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join('-');
  index++;
  return `${selectedLevels}-${fileUuid}-${index}`;
};

/**
 * 获取位置
 * @param {string} code 代码
 * @param {number} line 行号
 * @param {number} column 列号
 * @returns {object}
 */
const getPosition = (code, line, column) => {
  const lines = code.split('\n');
  let position = 0;
  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1;
  }
  position += column;
  return position;
};

/**
 * 遍历脚本
 * @param {object} ast 抽象语法树
 * @param {string} script 脚本内容
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {object} config 配置
 */
const traverseScript = (ast, script, filePath, fileUuid, config) => {
  let modifiedScript = script;
  let prePath;
  let offset = 0;
  traverse(ast, {
    StringLiteral(path) {
      if (chineseRegex.test(path.node.value)) {
        const uuid = generateUUID(filePath, fileUuid, index, config);
        const start = path.node.loc.start;
        const end = path.node.loc.end;
        let startPos = getPosition(modifiedScript, start.line, start.column);
        let endPos = getPosition(modifiedScript, end.line, end.column);
        const replacement = `${config.scriptI18nCall}('${uuid}')`;
        if (prePath && prePath.node.loc.start.line === start.line) {
          const preStartPos = getPosition(
            modifiedScript,
            prePath.node.loc.start.line,
            prePath.node.loc.start.column,
          );
          const preEndPos = getPosition(
            modifiedScript,
            prePath.node.loc.end.line,
            prePath.node.loc.end.column,
          );
          const lineOffset = replacement.length - (preEndPos - preStartPos);
          startPos += lineOffset;
          endPos += lineOffset;
        }
        modifiedScript =
          modifiedScript.substring(0, startPos) +
          replacement +
          modifiedScript.substring(endPos);
        offset += replacement.length - (endPos - startPos);
        hasI18nUsageInScript = true;
        hasI18nUsageInScriptSetup = true;
        prePath = path;
        index++;
        collectChineseText(uuid, path.node.value);
      }
    },
    TemplateLiteral(path) {
      path.node.quasis.forEach((quasi) => {
        if (chineseRegex.test(quasi.value.raw)) {
          const uuid = generateUUID(filePath, fileUuid, index, config);
          const start = quasi.start + offset;
          const end = quasi.end + offset;
          const replacement =
            '${' + `${config.scriptI18nCall}('${uuid}')` + '}';
          modifiedScript =
            modifiedScript.substring(0, start) +
            replacement +
            modifiedScript.substring(end);
          offset += replacement.length - (end - start);
          hasI18nUsageInScript = true;
          hasI18nUsageInScriptSetup = true;
          index++;
          collectChineseText(uuid, quasi.value.raw);
        }
      });
    },
  });
  return modifiedScript;
};

/**
 * 遍历模板
 * @param {object} ast 抽象语法树
 * @param {string} template 模板内容
 * @param {string} filePath 文件路径
 * @param {string} fileUuid 文件 UUID
 * @param {object} config 配置
 */
const traverseTemplate = (ast, template, filePath, fileUuid, config) => {
  let modifiedTemplate = template;
  let offset = 0;
  const traverseNode = (node) => {
    switch (node.type) {
      case 0: // Root Node（根节点）
      case 8: // Slot Node（插槽节点）
      case 10: // For Node（循环节点）
        if (node.children) {
          node.children.forEach(traverseNode);
        }
        break;
      case 1: // Element Node（元素节点）
        if (node.props) {
          node.props.forEach((prop) => {
            // Expression Node（表达式节点）
            if (prop.type === 1) {
              console.log('未适配的prop节点', prop.type, prop);
            }
            // Interpolation Node（插值节点）
            if (prop.type === 2) {
              console.log('未适配的prop节点', prop.type, prop);
            }
            // Text Node（文本节点）
            if (prop.type === 3) {
              console.log('未适配的prop节点', prop.type, prop);
            }
            // Comment Node（注释节点）
            if (prop.type === 4) {
              console.log('未适配的prop节点', prop.type, prop);
            }
            // Attribute Node（属性节点）
            if (
              prop.type === 6 &&
              prop.value &&
              prop.value.content &&
              chineseRegex.test(prop.value.content)
            ) {
              const nameStart = prop.loc.start.offset + offset;
              modifiedTemplate =
                modifiedTemplate.substring(0, nameStart) +
                ':' +
                modifiedTemplate.substring(nameStart);
              offset++;
              const uuid = generateUUID(filePath, fileUuid, index, config);
              const start = prop.value.loc.start.offset + offset;
              const end = prop.value.loc.end.offset + offset;
              const replacementText = `"${config.templateI18nCall}('${uuid}')"`;
              modifiedTemplate =
                modifiedTemplate.substring(0, start) +
                replacementText +
                modifiedTemplate.substring(end);
              offset += replacementText.length - (end - start);
              index++;
              collectChineseText(uuid, prop.value.content);
            }
            // Directive Node（指令节点）
            if (
              prop.type === 7 &&
              prop.exp &&
              chineseRegex.test(prop.exp.content)
            ) {
              const content = prop.exp.content;
              const start = prop.exp.loc.start.offset;
              const chineseRegex = /[\u4e00-\u9fa5]+/g;
              let match;
              while ((match = chineseRegex.exec(content))) {
                const matchStart = start + match.index + offset;
                const matchEnd = matchStart + match[0].length;
                const uuid = generateUUID(filePath, fileUuid, index, config);
                const replacement =
                  '${' + `${config.templateI18nCall}('${uuid}')` + '}';
                modifiedTemplate =
                  modifiedTemplate.substring(0, matchStart) +
                  replacement +
                  modifiedTemplate.substring(matchEnd);
                offset += replacement.length - (matchEnd - matchStart);
                index++;
                collectChineseText(uuid, match[0]);
              }
            }
          });
        }
        if (node.children) node.children.forEach(traverseNode);
        break;
      case 2:
        if (chineseRegex.test(node.content)) {
          const uuid = generateUUID(filePath, fileUuid, index, config);
          const start = node.loc.start.offset + offset;
          const end = node.loc.end.offset + offset;
          const replacementText = `{{ ${config.templateI18nCall}('${uuid}') }}`;
          modifiedTemplate =
            modifiedTemplate.substring(0, start) +
            replacementText +
            modifiedTemplate.substring(end);
          offset += replacementText.length - (end - start);
          index++;
          collectChineseText(uuid, node.content);
        }
        break;
      case 5: // Interpolation Node（插值节点）
        if (chineseRegex.test(node.loc.source)) {
          let content = node.loc.source;
          const start = node.loc.start.offset;
          // 判断是否有插值表达式
          const hasInterpolation = node.loc.source.includes('{{');
          if (hasInterpolation) {
            const chineseRegex = /[\u4e00-\u9fa5]+/g;
            let match;
            while ((match = chineseRegex.exec(content))) {
              const matchStart = start + match.index + offset;
              const matchEnd = matchStart + match[0].length;
              const uuid = generateUUID(filePath, fileUuid, index, config);
              const replacement = `${config.templateI18nCall}('${uuid}')`;
              modifiedTemplate =
                modifiedTemplate.substring(0, matchStart - 1) +
                replacement +
                modifiedTemplate.substring(matchEnd + 1);
              offset += replacement.length - (matchEnd - matchStart) - 2; // 更新偏移量
              index++;
              collectChineseText(uuid, match[0]);
            }
          } else {
            console.log('没有{{}}', content);
          }
        }
        break;
      case 12: // Interpolation Node（插值节点）
        if (chineseRegex.test(node.loc.source)) {
          const uuid = generateUUID(filePath, fileUuid, index, config);
          const start = node.loc.start.offset + offset;
          const end = node.loc.end.offset + offset;
          const replacementText = `{{ ${config.templateI18nCall}('${uuid}') }}`;
          modifiedTemplate =
            modifiedTemplate.substring(0, start) +
            replacementText +
            modifiedTemplate.substring(end);
          offset += replacementText.length - (end - start);
          index++;
          collectChineseText(uuid, node.loc.source);
        }
        break;
      case 9:
        if (node.branches) node.branches.forEach(traverseNode);
        break;
      default:
        customLog(config.debug, '未适配的node节点', node.type);
        break;
    }
  };
  traverseNode(ast);
  return modifiedTemplate;
};

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath) => {
  try {
    const config = getConfig(true);
    const currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
    filePath = filePath || currentFilePath;
    const fileExtension = path.extname(filePath);
    if (config.excludedExtensions.includes(fileExtension)) return;
    const fileUuid = generateUniqueId();
    let script;
    let text;

    if (fileExtension === '.vue') {
      text = await readFileContent(filePath);
      const { descriptor } = parseSfc(text);
      const template = descriptor.template ? descriptor.template.content : '';
      script = descriptor.script ? descriptor.script.content : '';
      const scriptSetup = descriptor.scriptSetup
        ? descriptor.scriptSetup.content
        : '';
      const templateAst = parseTemplate(template);
      const scriptSetupAst = babelParse(scriptSetup, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      if (templateAst) {
        const modifiedTemplate = traverseTemplate(
          templateAst,
          template,
          filePath,
          fileUuid,
          config,
        );
        text = text.replace(template, modifiedTemplate);
      }
      if (
        scriptSetupAst &&
        scriptSetupAst.program &&
        scriptSetupAst.program.body.length > 0
      ) {
        let modifiedScript = traverseScript(
          scriptSetupAst,
          scriptSetup,
          filePath,
          fileUuid,
          config,
        );
        const alreadyImported = modifiedScript.match(
          /import\s+(?:i18n)\s+from\s+['"].*['"]/,
        );
        if (!alreadyImported && hasI18nUsageInScriptSetup) {
          modifiedScript = `\n${config.autoImportI18n}` + modifiedScript;
        }
        text = text.replace(scriptSetup, modifiedScript);
      }
    } else {
      text = await readFileContent(filePath);
      script = text;
    }

    const scriptAst = babelParse(script, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    if (scriptAst && scriptAst.program && scriptAst.program.body.length > 0) {
      let modifiedScript = traverseScript(
        scriptAst,
        script,
        filePath,
        fileUuid,
        config,
      );
      const alreadyImported = modifiedScript.match(
        /import\s+(?:i18n)\s+from\s+['"].*['"]/,
      );
      if (!alreadyImported && hasI18nUsageInScript) {
        modifiedScript = `\n${config.autoImportI18n}` + modifiedScript;
      }
      text = text.replace(script, modifiedScript);
    }

    await saveFileContent(filePath, text);
    const obj = Object.fromEntries(chineseTexts);
    await saveObjectToPath(obj, `${config.i18nFilePath}/locale/zh.json`);

    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }
    index = 0;
    chineseTexts = new Map();
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
