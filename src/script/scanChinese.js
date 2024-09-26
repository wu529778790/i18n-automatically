const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { parse: parseSfc } = require("@vue/compiler-sfc");
const {
  parse: parseTemplate,
  // compile: compileDom,
  // generate: generateDom,
} = require("@vue/compiler-dom");
const { parse: babelParse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
// const { default: generate } = require("@babel/generator");
const { getConfig } = require("./setting.js");
const { updateDecorations } = require("./switchLanguage.js");
const {
  generateUniqueId,
  saveObjectToPath,
  customLog,
} = require("../utils/index.js");

let chineseTexts = new Map();
let index = 0;

const collectChineseText = (uuid, content) => {
  if (typeof content !== "string") {
    return;
  }
  content = content.trim();
  if (content && !chineseTexts.has(uuid)) {
    chineseTexts.set(uuid, content);
  }
};

/**
 * 读取文件内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>}
 */
const readFileContent = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
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
    await fs.promises.writeFile(filePath, content, "utf-8");
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
    selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join("-");
  index++;
  return `${selectedLevels}-${fileUuid}-${index}`;
};

const getPosition = (code, line, column) => {
  const lines = code.split("\n");
  let position = 0;
  for (let i = 0; i < line - 1; i++) {
    position += lines[i].length + 1; // +1 for newline character
  }
  position += column;
  return position;
};

/**
 * 扫描中文
 * @returns {Promise<void>}
 */
exports.scanChinese = async (filePath) => {
  try {
    // 读取配置文件
    const config = getConfig(true);
    const currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
    // 如果 filePath 不存在，那么获取当前操作文件的路径
    filePath = filePath || currentFilePath;
    const text = await readFileContent(filePath);
    // 生成文件的唯一标识
    const fileUuid = generateUniqueId();

    const { descriptor } = parseSfc(text);
    let modifiedText = text;
    const chineseRegex = /[\u4e00-\u9fa5]/;
    // 解析 Vue 文件
    const template = descriptor.template ? descriptor.template.content : "";
    const script = descriptor.script ? descriptor.script.content : "";
    const scriptSetup = descriptor.scriptSetup
      ? descriptor.scriptSetup.content
      : "";
    // 解析模板
    const templateAst = parseTemplate(template);

    // 解析脚本部分
    const scriptAst = babelParse(script, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const scriptSetupAst = babelParse(scriptSetup, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const traverseTemplate = (ast, template) => {
      let modifiedTemplate = template;
      // 偏移量
      let offset = 0;
      const traverseNode = (node) => {
        customLog(config.debug, "node", node);
        switch (node.type) {
          case 0: // Root Node（根节点）
            if (node.children) {
              node.children.forEach(traverseNode);
            }
            break;

          case 1: // Element Node（元素节点）
            if (node.props) {
              node.props.forEach((prop) => {
                customLog(config.debug, "prop", prop);
                // Expression Node（表达式节点）
                if (prop.type === 1 && prop.content) {
                  customLog(config.debug, "未适配的prop节点", prop.type);
                }
                // Interpolation Node（插值节点）
                if (prop.type === 2 && prop.content) {
                  customLog(config.debug, "未适配的prop节点", prop.type);
                }
                // Text Node（文本节点）
                if (prop.type === 3 && prop.content) {
                  customLog(config.debug, "未适配的prop节点", prop.type);
                }
                // Comment Node（注释节点）
                if (prop.type === 4 && prop.content) {
                  customLog(config.debug, "未适配的prop节点", prop.type);
                }
                // Attribute Node（属性节点）
                if (
                  prop.type === 6 &&
                  prop.value &&
                  prop.value.content &&
                  chineseRegex.test(prop.value.content)
                ) {
                  // name
                  const nameStart = prop.loc.start.offset + offset;
                  modifiedTemplate =
                    modifiedTemplate.substring(0, nameStart) +
                    ":" +
                    modifiedTemplate.substring(nameStart);
                  offset++;
                  // 属性值
                  const uuid = generateUUID(filePath, fileUuid, index, config);
                  const start = prop.value.loc.start.offset + offset;
                  const end = prop.value.loc.end.offset + offset;
                  const replacementText = `"${config.templateI18nCall}('${uuid}')"`;
                  modifiedTemplate =
                    modifiedTemplate.substring(0, start) +
                    replacementText +
                    modifiedTemplate.substring(end);
                  offset += replacementText.length - (end - start); // 更新偏移量
                  index++;
                  collectChineseText(uuid, prop.value.content);
                }
                // Directive Node（指令节点）
                if (prop.type === 7 && prop.content) {
                  customLog(config.debug, "未适配的prop节点", prop.type);
                }
              });
            }
            if (node.children) {
              node.children.forEach(traverseNode);
            }
            break;

          case 2: // Text Node（文本节点）
            if (chineseRegex.test(node.content)) {
              const uuid = generateUUID(filePath, fileUuid, index, config);
              const start = node.loc.start.offset + offset;
              const end = node.loc.end.offset + offset;
              const replacementText = `{{ ${config.templateI18nCall}('${uuid}') }}`;
              modifiedTemplate =
                modifiedTemplate.substring(0, start) +
                replacementText +
                modifiedTemplate.substring(end);
              offset += replacementText.length - (end - start); // 更新偏移量
              index++;
              collectChineseText(uuid, node.content);
            }
            break;
          case 5: // Interpolation Node（插值节点）
            if (chineseRegex.test(node.loc.source)) {
              let content = node.loc.source;
              const start = node.loc.start.offset;
              // 判断是否有插值表达式
              const hasInterpolation = node.loc.source.includes("{{");
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
                  collectChineseText(uuid, match);
                }
              } else {
                console.log("没有{{}}", content);
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
              offset += replacementText.length - (end - start); // 更新偏移量
              index++;
              collectChineseText(uuid, node.loc.source);
            }
            break;

          case 8: // Slot Node（插槽节点）
          case 10: // For Node（循环节点）
            if (node.children) {
              node.children.forEach(traverseNode);
            }
            break;

          case 9: // If Node（条件节点）
            if (node.branches) {
              node.branches.forEach(traverseNode);
            }
            break;

          default:
            customLog(config.debug, "未适配的node节点", node.type);
            break;
        }
      };

      traverseNode(ast);

      return modifiedTemplate;
    };

    // 遍历 AST 并生成修改后的模板字符串
    if (templateAst) {
      const modifiedTemplate = traverseTemplate(templateAst, template);
      modifiedText = modifiedText.replace(template, modifiedTemplate);
    }

    let hasI18nUsageInScript = false;
    let hasI18nUsageInScriptSetup = false;

    // 遍历脚本AST并修改中文文本
    const traverseScript = (ast, script) => {
      let modifiedScript = script;
      let prePath;
      let offset = 0;
      traverse(ast, {
        StringLiteral(path) {
          customLog(config.debug, "StringLiteral", path);
          if (chineseRegex.test(path.node.value)) {
            customLog(config.debug, path.node.value);
            const uuid = generateUUID(filePath, fileUuid, index, config);
            const start = path.node.loc.start;
            const end = path.node.loc.end;
            let startPos = getPosition(
              modifiedScript,
              start.line,
              start.column
            );
            let endPos = getPosition(modifiedScript, end.line, end.column);
            const replacement = `${config.scriptI18nCall}('${uuid}')`;
            if (prePath && prePath.node.loc.start.line === start.line) {
              const preStartPos = getPosition(
                modifiedScript,
                prePath.node.loc.start.line,
                prePath.node.loc.start.column
              );
              const preEndPos = getPosition(
                modifiedScript,
                prePath.node.loc.end.line,
                prePath.node.loc.end.column
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
            hasI18nUsageInScriptSetup = true;
            hasI18nUsageInScript = true;
            prePath = path;
            index++;
            collectChineseText(uuid, path.node.value);
          }
        },
        TemplateLiteral(path) {
          customLog(config.debug, "TemplateLiteral", path);
          path.node.quasis.forEach((quasi) => {
            if (chineseRegex.test(quasi.value.raw)) {
              customLog(config.debug, "quasi", quasi);
              customLog(config.debug, quasi.value.raw);
              const uuid = generateUUID(filePath, fileUuid, index, config);
              const start = quasi.start + offset;
              const end = quasi.end + offset;
              const replacement =
                "${" + `${config.scriptI18nCall}('${uuid}')` + "}";
              modifiedScript =
                modifiedScript.substring(0, start) +
                replacement +
                modifiedScript.substring(end);
              offset += replacement.length - (end - start);
              hasI18nUsageInScriptSetup = true;
              hasI18nUsageInScript = true;
              index++;
              collectChineseText(uuid, quasi.value.raw);
            }
          });
        },
      });

      return modifiedScript;
    };

    if (scriptAst && scriptAst.program && scriptAst.program.body.length > 0) {
      let modifiedScript = traverseScript(scriptAst, script);
      // 如果在 script 标签中没有找到 i18n 引用，并且有 i18n 的用法，就插入到引入 i18n 的语句
      const alreadyImported = modifiedScript.match(
        /import\s+(?:i18n)\s+from\s+['"].*['"]/
      );
      if (!alreadyImported && hasI18nUsageInScript) {
        modifiedScript = `\n${config.autoImportI18n}` + modifiedScript;
      }
      modifiedText = modifiedText.replace(script, modifiedScript);
    }

    if (
      scriptSetupAst &&
      scriptSetupAst.program &&
      scriptSetupAst.program.body.length > 0
    ) {
      let modifiedScript = traverseScript(scriptSetupAst, scriptSetup);
      // 如果在 script 标签中没有找到 i18n 引用，并且有 i18n 的用法，就插入到引入 i18n 的语句
      const alreadyImported = modifiedScript.match(
        /import\s+(?:i18n)\s+from\s+['"].*['"]/
      );
      if (!alreadyImported && hasI18nUsageInScriptSetup) {
        modifiedScript = `\n${config.autoImportI18n}` + modifiedScript;
      }
      modifiedText = modifiedText.replace(scriptSetup, modifiedScript);
    }

    // 保存文件
    await saveFileContent(filePath, modifiedText);
    // 保存语言包
    const obj = Object.fromEntries(chineseTexts);
    await saveObjectToPath(obj, `${config.i18nFilePath}/locale/zh.json`);

    // 如果是当前文件，更新装饰器
    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }
    // 重置索引和状态
    index = 0;
    chineseTexts = new Map();
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
