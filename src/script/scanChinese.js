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
const { default: generate } = require("@babel/generator");
const { getConfig } = require("./setting.js");
const { updateDecorations } = require("./switchLanguage.js");
const { generateUniqueId, saveObjectToPath } = require("../utils/index.js");

const chineseTexts = new Map();
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
    // 解析 Vue 文件
    const template = descriptor.template ? descriptor.template.content : "";
    const script = descriptor.script ? descriptor.script.content : "";
    const scriptSetup = descriptor.scriptSetup
      ? descriptor.scriptSetup.content
      : "";
    // 解析模板
    const templateAst = parseTemplate(template);

    const traverseTemplate = (ast, content) => {
      let modifiedTemplate = content;
      // 偏移量
      let offset = 0;
      const traverseNode = (node) => {
        console.log("node", node);
        const chineseRegex = /[\u4e00-\u9fa5]/;
        switch (node.type) {
          case 0: // Root Node（根节点）
            if (node.children) {
              node.children.forEach(traverseNode);
            }
            break;

          case 1: // Element Node（元素节点）
            if (node.props) {
              node.props.forEach((prop) => {
                console.log("prop", prop);
                // Expression Node（表达式节点）
                if (prop.type === 1 && prop.content) {
                  console.log("未适配的prop节点", prop.type);
                }
                // Interpolation Node（插值节点）
                if (prop.type === 2 && prop.content) {
                  console.log("未适配的prop节点", prop.type);
                }
                // Text Node（文本节点）
                if (prop.type === 3 && prop.content) {
                  console.log("未适配的prop节点", prop.type);
                }
                // Comment Node（注释节点）
                if (prop.type === 4 && prop.content) {
                  console.log("未适配的prop节点", prop.type);
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
                  console.log("未适配的prop节点", prop.type);
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
              const start = node.loc.start.offset + offset;
              const end = node.loc.end.offset + offset;
              // 判断是否有插值表达式
              const hasInterpolation = node.loc.source.includes("{{");
              if (hasInterpolation) {
                const findChineseMatches = (text) => {
                  const chineseRegex = /[\u4e00-\u9fa5]+/g;
                  const matches = [];
                  let match;
                  while ((match = chineseRegex.exec(text))) {
                    matches.push({
                      match: match[0],
                      start: match.index,
                      end: match.index + match[0].length,
                    });
                  }
                  return matches;
                };
                const chineseMatches = findChineseMatches(content);
                chineseMatches.forEach((item) => {
                  const uuid = generateUUID(filePath, fileUuid, index, config);
                  const replacementText = `${config.templateI18nCall}('${uuid}')`;
                  // 下面的-1和+1假定了中文外面有字符串
                  content =
                    content.substring(0, item.start - 1) +
                    replacementText +
                    content.substring(item.end + 1);
                  offset +=
                    replacementText.length - (item.end - item.start) - 2; // 更新偏移量
                  index++;
                  collectChineseText(uuid, item.match);
                });

                const replacementText = content;
                modifiedTemplate =
                  modifiedTemplate.substring(0, start) +
                  replacementText +
                  modifiedTemplate.substring(end);
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
            console.log("未适配的node节点", node.type);
            break;
        }
      };

      traverseNode(ast);

      return modifiedTemplate;
    };

    // 遍历 AST 并生成修改后的模板字符串
    const modifiedTemplate = traverseTemplate(templateAst, template);
    // 解析脚本部分
    // const scriptAst = babelParse(script, {
    //   sourceType: "module",
    //   plugins: ["jsx", "typescript"],
    // });

    // const scriptSetupAst = babelParse(scriptSetup, {
    //   sourceType: "module",
    //   plugins: ["jsx", "typescript"],
    // });

    // 遍历脚本AST并修改中文文本
    // const traverseScript = (ast) => {
    //   const traverseNode = (node) => {
    //     const chineseRegex = /[\u4e00-\u9fa5]/;
    //     if (node.type === "StringLiteral" && chineseRegex.test(node.value)) {
    //       collectChineseText(node.value);
    //       node.value = node.value.replace(chineseRegex, fileUuid);
    //     }
    //     if (node.type === "TemplateLiteral" && node.quasis) {
    //       node.quasis.forEach((quasi) => {
    //         if (chineseRegex.test(quasi.value.raw)) {
    //           collectChineseText(quasi.value.raw);
    //           quasi.value.raw = quasi.value.raw.replace(chineseRegex, fileUuid);
    //         }
    //       });
    //     }
    //     if (node.type === "JSXText" && chineseRegex.test(node.value)) {
    //       collectChineseText(node.value);
    //       node.value = node.value.replace(chineseRegex, fileUuid);
    //     }
    //     if (node.type === "JSXElement" && node.children) {
    //       node.children.forEach(traverseNode);
    //     }
    //     if (
    //       node.type === "JSXAttribute" &&
    //       node.value &&
    //       node.value.type === "StringLiteral" &&
    //       chineseRegex.test(node.value.value)
    //     ) {
    //       collectChineseText(node.value.value);
    //       node.value.value = node.value.value.replace(chineseRegex, fileUuid);
    //     }
    //     if (
    //       node.type === "ExpressionStatement" &&
    //       node.expression &&
    //       node.expression.type === "CallExpression" &&
    //       node.expression.arguments
    //     ) {
    //       node.expression.arguments.forEach(traverseNode);
    //     }
    //     if (node.type === "ObjectExpression" && node.properties) {
    //       node.properties.forEach(traverseNode);
    //     }
    //     if (node.type === "ArrayExpression" && node.elements) {
    //       node.elements.forEach(traverseNode);
    //     }
    //     if (node.type === "FunctionDeclaration" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "BlockStatement" && node.body) {
    //       node.body.forEach(traverseNode);
    //     }
    //     if (node.type === "ReturnStatement" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "IfStatement" && node.consequent) {
    //       traverseNode(node.consequent);
    //     }
    //     if (node.type === "IfStatement" && node.alternate) {
    //       traverseNode(node.alternate);
    //     }
    //     if (node.type === "ForStatement" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "WhileStatement" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "DoWhileStatement" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "SwitchStatement" && node.cases) {
    //       node.cases.forEach(traverseNode);
    //     }
    //     if (node.type === "SwitchCase" && node.consequent) {
    //       node.consequent.forEach(traverseNode);
    //     }
    //     if (node.type === "TryStatement" && node.block) {
    //       traverseNode(node.block);
    //     }
    //     if (node.type === "CatchClause" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "VariableDeclaration" && node.declarations) {
    //       node.declarations.forEach(traverseNode);
    //     }
    //     if (node.type === "VariableDeclarator" && node.init) {
    //       traverseNode(node.init);
    //     }
    //     if (node.type === "AssignmentExpression" && node.right) {
    //       traverseNode(node.right);
    //     }
    //     if (node.type === "LogicalExpression" && node.left) {
    //       traverseNode(node.left);
    //     }
    //     if (node.type === "LogicalExpression" && node.right) {
    //       traverseNode(node.right);
    //     }
    //     if (node.type === "ConditionalExpression" && node.consequent) {
    //       traverseNode(node.consequent);
    //     }
    //     if (node.type === "ConditionalExpression" && node.alternate) {
    //       traverseNode(node.alternate);
    //     }
    //     if (node.type === "SequenceExpression" && node.expressions) {
    //       node.expressions.forEach(traverseNode);
    //     }
    //     if (node.type === "UnaryExpression" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "BinaryExpression" && node.left) {
    //       traverseNode(node.left);
    //     }
    //     if (node.type === "BinaryExpression" && node.right) {
    //       traverseNode(node.right);
    //     }
    //     if (node.type === "MemberExpression" && node.object) {
    //       traverseNode(node.object);
    //     }
    //     if (node.type === "MemberExpression" && node.property) {
    //       traverseNode(node.property);
    //     }
    //     if (node.type === "CallExpression" && node.arguments) {
    //       node.arguments.forEach(traverseNode);
    //     }
    //     if (node.type === "NewExpression" && node.arguments) {
    //       node.arguments.forEach(traverseNode);
    //     }
    //     if (node.type === "UpdateExpression" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "AwaitExpression" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "YieldExpression" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "ArrowFunctionExpression" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "ClassDeclaration" && node.body) {
    //       traverseNode(node.body);
    //     }
    //     if (node.type === "ClassBody" && node.body) {
    //       node.body.forEach(traverseNode);
    //     }
    //     if (node.type === "MethodDefinition" && node.value) {
    //       traverseNode(node.value);
    //     }
    //     if (node.type === "Property" && node.value) {
    //       traverseNode(node.value);
    //     }
    //     if (node.type === "ObjectPattern" && node.properties) {
    //       node.properties.forEach(traverseNode);
    //     }
    //     if (node.type === "ArrayPattern" && node.elements) {
    //       node.elements.forEach(traverseNode);
    //     }
    //     if (node.type === "RestElement" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "AssignmentPattern" && node.right) {
    //       traverseNode(node.right);
    //     }
    //     if (node.type === "SpreadElement" && node.argument) {
    //       traverseNode(node.argument);
    //     }
    //     if (node.type === "TemplateElement" && node.value) {
    //       traverseNode(node.value);
    //     }
    //     if (node.type === "TaggedTemplateExpression" && node.quasi) {
    //       traverseNode(node.quasi);
    //     }
    //     if (node.type === "MetaProperty" && node.meta) {
    //       traverseNode(node.meta);
    //     }
    //     if (node.type === "MetaProperty" && node.property) {
    //       traverseNode(node.property);
    //     }
    //     if (node.type === "ImportDeclaration" && node.specifiers) {
    //       node.specifiers.forEach(traverseNode);
    //     }
    //     if (node.type === "ImportSpecifier" && node.imported) {
    //       traverseNode(node.imported);
    //     }
    //     if (node.type === "ImportDefaultSpecifier" && node.local) {
    //       traverseNode(node.local);
    //     }
    //     if (node.type === "ImportNamespaceSpecifier" && node.local) {
    //       traverseNode(node.local);
    //     }
    //     if (node.type === "ExportNamedDeclaration" && node.declaration) {
    //       traverseNode(node.declaration);
    //     }
    //     if (node.type === "ExportDefaultDeclaration" && node.declaration) {
    //       traverseNode(node.declaration);
    //     }
    //     if (node.type === "ExportAllDeclaration" && node.source) {
    //       traverseNode(node.source);
    //     }
    //     if (node.type === "ExportSpecifier" && node.exported) {
    //       traverseNode(node.exported);
    //     }
    //     if (node.type === "ExportSpecifier" && node.local) {
    //       traverseNode(node.local);
    //     }
    //     if (node.type === "Program" && node.body) {
    //       node.body.forEach(traverseNode);
    //     }
    //   };

    //   traverseNode(ast);
    // };

    // traverseScript(scriptAst);
    // traverseScript(scriptSetupAst);

    // const scriptCode = generate(scriptAst).code;
    // const scriptSetupCode = generate(scriptSetupAst).code;

    // 替换原模板内容
    const newText = text.replace(template, modifiedTemplate);
    // .replace(script, scriptCode)
    // .replace(scriptSetup, scriptSetupCode);
    // 保存文件
    saveFileContent(filePath, newText);
    const obj = Object.fromEntries(chineseTexts);
    // 调用保存文件方法
    await saveObjectToPath(obj, `${config.i18nFilePath}/locale/zh.json`);

    // 如果是当前文件，更新装饰器
    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
