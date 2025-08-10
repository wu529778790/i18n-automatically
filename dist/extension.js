"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const require$$0 = require("vscode");
const require$$1 = require("fs");
const require$$2 = require("path");
const require$$2$1 = require("@babel/generator");
const require$$0$2 = require("@vue/compiler-sfc");
const require$$0$1 = require("@babel/traverse");
const require$$1$1 = require("@babel/parser");
const require$$2$2 = require("@babel/types");
const require$$6 = require("prettier");
const require$$0$3 = require("axios");
const require$$1$2 = require("md5");
const require$$0$4 = require("@vitalets/google-translate-api");
var extension = {};
var setting$2 = {};
var utils = {};
(function(exports2) {
  const vscode2 = require$$0;
  const fs2 = require$$1;
  const path2 = require$$2;
  exports2.generateUniqueId = () => {
    const timestamp = Date.now().toString(16);
    const random = Math.random().toString(16).substring(2, 8);
    return timestamp + random;
  };
  exports2.saveObjectToPath = (obj, filePath) => {
    const rootPath = exports2.getRootPath();
    const newFilePath = path2.join(rootPath, filePath);
    const directory = path2.dirname(newFilePath);
    return new Promise((resolve, reject) => {
      if (!fs2.existsSync(directory)) {
        fs2.mkdirSync(directory, { recursive: true });
      }
      let updatedContent = obj;
      if (fs2.existsSync(newFilePath)) {
        try {
          const fileContent = fs2.readFileSync(newFilePath, "utf-8");
          const fileContentObj = fileContent ? JSON.parse(fileContent) : {};
          updatedContent = { ...fileContentObj, ...obj };
        } catch (error) {
          reject(`Error reading or parsing file: ${newFilePath}`);
        }
      }
      try {
        fs2.writeFileSync(
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
  exports2.getRootPath = () => {
    return vscode2.workspace.workspaceFolders[0].uri.fsPath;
  };
})(utils);
const fs$3 = require$$1;
const path$2 = require$$2;
const vscode$8 = require$$0;
const { getRootPath: getRootPath$1 } = utils;
const defaultConfig = {
  i18nFilePath: "/src/i18n",
  autoImportI18n: true,
  i18nImportPath: "@/i18n",
  templateI18nCall: "$t",
  scriptI18nCall: "i18n.global.t",
  keyFilePathLevel: 2,
  excludeDebugContexts: false,
  excludedExtensions: [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".md",
    ".txt",
    ".json",
    ".css",
    ".scss",
    ".less",
    ".sass",
    ".styl"
  ],
  excludedStrings: [
    "宋体",
    "黑体",
    "楷体",
    "仿宋",
    "微软雅黑",
    "华文",
    "方正",
    "苹方",
    "思源",
    "YYYY年MM月DD日"
  ],
  freeGoogle: true,
  baidu: {
    appid: "",
    secretKey: ""
  },
  deepl: {
    authKey: "",
    isPro: false
  }
};
setting$2.setting = () => {
  const rootPath = getRootPath$1();
  const configFilePath = path$2.join(rootPath, "/automatically-i18n-config.json");
  if (!fs$3.existsSync(configFilePath)) {
    handleMissingConfig(configFilePath, true);
  }
  vscode$8.workspace.openTextDocument(configFilePath).then((document) => {
    vscode$8.window.showTextDocument(document);
  });
};
let cacheConfig;
setting$2.readConfig = (initConfigFile = false, clearCache = false) => {
  if (cacheConfig && !clearCache) {
    return cacheConfig;
  } else {
    cacheConfig = initConfig(initConfigFile);
    return cacheConfig;
  }
};
function initConfig(initConfigFile = true) {
  try {
    const rootPath = getRootPath$1();
    const configFilePath = path$2.join(
      rootPath,
      "/automatically-i18n-config.json"
    );
    if (!fs$3.existsSync(configFilePath)) {
      return handleMissingConfig(configFilePath, initConfigFile);
    }
    const config = JSON.parse(fs$3.readFileSync(configFilePath, "utf8"));
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.error("读取配置文件时出现错误：", error);
    return defaultConfig;
  }
}
function handleMissingConfig(configFilePath, initConfigFile) {
  if (initConfigFile) {
    try {
      fs$3.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.error("创建配置文件时出现错误：", error);
    }
  }
  return;
}
var scanChinese$3 = {};
var I18nProcessor = { exports: {} };
const fs$2 = require$$1;
const path$1 = require$$2;
const generate = require$$2$1.default;
const vscode$7 = require$$0;
const { generateUniqueId } = utils;
const { readConfig: readConfig$6 } = setting$2;
function createContext(filePath, config) {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config: {
      ...config,
      isAutoImportI18n: true,
      // 默认开启：跳过调试上下文，除非配置中显式为 false
      excludeDebugContexts: config && "excludeDebugContexts" in config ? config.excludeDebugContexts : true
    },
    index: 0,
    translations: /* @__PURE__ */ new Map(),
    contentSource: fs$2.readFileSync(filePath, "utf-8"),
    contentChanged: "",
    ast: null
  };
}
function createI18nProcessor$2(astProcessor) {
  return function(filePath, config) {
    const context = createContext(filePath, config);
    return astProcessor(context);
  };
}
function generateKey$2(context) {
  const { filePath, fileUuid, config } = context;
  const pathParts = filePath.split(path$1.sep);
  const pathDeep = config.keyFilePathLevel || 2;
  const selectedLevelsParts = pathParts.slice(-pathDeep);
  const lastLevelWithoutExtension = selectedLevelsParts[selectedLevelsParts.length - 1].split(".")[0];
  const selectedLevels = selectedLevelsParts.slice(0, -1).concat(lastLevelWithoutExtension).join("-");
  context.index++;
  return `${selectedLevels}-${fileUuid}-${context.index}`;
}
function generateCode$2(ast, content) {
  const opts = {
    retainLines: true,
    jsonCompatibleStrings: true,
    flowCommaSeparator: true,
    quotes: "single",
    // 强制使用单引号
    jsescOption: {
      // 避免类型不兼容报错，顶层 quotes 已设为 'single'
      wrap: true
    }
  };
  return generate(ast, opts, content).code;
}
function stringWithDom$2(str) {
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}
function containsChinese$2(str, isExcluded = false) {
  const chineseRegex = /[\u4e00-\u9fa5]/;
  if (!chineseRegex.test(str)) {
    return false;
  }
  const imageExtensionRegex = /\.(png|jpe?g|gif|svg|webp)(['"]|\?[^'"\s]*)?$/i;
  if (imageExtensionRegex.test(str)) {
    return false;
  }
  if (!isExcluded) {
    const config = readConfig$6();
    if (Array.isArray(config.excludedStrings) && config.excludedStrings.length) {
      const isExcludedByConfig = config.excludedStrings.includes(str.trim());
      if (isExcludedByConfig) {
        return false;
      }
    }
  }
  return true;
}
class TranslationManager {
  constructor() {
    this.getRootPath = () => {
      const workspaceFolders = vscode$7.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders[0] && workspaceFolders[0].uri) {
        return workspaceFolders[0].uri.fsPath || "";
      }
      return "";
    };
  }
  /**
   * 将翻译对象同步保存到指定路径的 JSON 文件中
   * @param {Map|Object} translations - 翻译数据，可以是 Map 或普通对象
   * @param {Object} config - 配置对象
   * @param {string} config.i18nFilePath - i18n 文件的相对路径
   * @param {string} [config.locale='zh'] - 语言代码
   */
  outputTranslationFile(translations, config) {
    const rootPath = this.getRootPath();
    const locale = config.locale || "zh";
    const filePath = path$1.join(
      rootPath,
      config.i18nFilePath,
      "locale",
      `${locale}.json`
    );
    const translationObj = translations instanceof Map ? Object.fromEntries(translations) : translations;
    try {
      fs$2.mkdirSync(path$1.dirname(filePath), { recursive: true });
      let updatedContent = translationObj;
      if (fs$2.existsSync(filePath)) {
        try {
          const fileContent = fs$2.readFileSync(filePath, {
            encoding: "utf-8",
            flag: "r"
          });
          if (fileContent.trim()) {
            const fileContentObj = JSON.parse(fileContent);
            updatedContent = { ...fileContentObj, ...translationObj };
          } else {
            updatedContent = { ...translationObj };
          }
        } catch (error) {
          throw new Error(
            `Error reading or parsing file: ${filePath}. ${error.message}`
          );
        }
      }
      fs$2.writeFileSync(
        filePath,
        JSON.stringify(updatedContent, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error(`Failed to output translation file: ${error.message}`);
      throw error;
    }
  }
}
var common = {
  createI18nProcessor: createI18nProcessor$2,
  generateKey: generateKey$2,
  generateCode: generateCode$2,
  containsChinese: containsChinese$2,
  TranslationManager,
  stringWithDom: stringWithDom$2
};
const traverse = require$$0$1.default;
const parser = require$$1$1;
const t = require$$2$2;
const {
  createI18nProcessor: createI18nProcessor$1,
  generateKey: generateKey$1,
  containsChinese: containsChinese$1,
  generateCode: generateCode$1,
  stringWithDom: stringWithDom$1
} = common;
function processJsAst$1(context, customContent) {
  try {
    context.hasPluginImport = false;
    const ast = parser.parse(customContent || context.contentSource, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"]
    });
    if (!ast) {
      return context;
    }
    traverse(
      /** @type {any} */
      ast,
      {
        Program: (path2) => checkForI18nImport(path2, context),
        TemplateElement: (path2) => handleChineseString(path2, context, true),
        StringLiteral: (path2) => handleChineseString(path2, context),
        JSXText: (path2) => handleChineseString(path2, context),
        JSXAttribute: (path2) => handleJSXAttribute(path2, context),
        JSXExpressionContainer: (path2) => handleJSXExpressionContainer(path2, context)
      }
    );
    if (context.index > (context.templateSize ? context.templateSize : 0) && !context.hasPluginImport && context.config.autoImportI18n) {
      addI18nImport(ast, context);
    }
    context.ast = ast;
    if (context.index > 0) {
      const originalCode = customContent || context.contentSource;
      context.contentChanged = generateCode$1(ast, originalCode).replace(
        /(?<=\?.)\n/g,
        ""
      );
    }
  } catch (error) {
    console.error("processJsAst 中出错:", error);
  } finally {
    return context;
  }
}
function checkForI18nImport(path2, context) {
  context.hasPluginImport = path2.node.body.some(
    (node) => node.type === "ImportDeclaration" && node.source.value.trim() === context.config.i18nImportPath
  );
}
function handleChineseString(path2, context, isTemplateLiteral = false) {
  try {
    const value = isTemplateLiteral ? path2.node.value.raw : path2.node.value;
    const skipDebugContexts = !("excludeDebugContexts" in (context.config || {})) || context.config.excludeDebugContexts !== false;
    if (!containsChinese$1(value) || skipDebugContexts && isInDebugContext(path2))
      return;
    if (stringWithDom$1(value)) {
      handleStringWithDom(path2, context, isTemplateLiteral);
      return;
    }
    const key = generateKey$1(context);
    if (isTemplateLiteral) {
      handleTemplateLiteral(path2, context, key);
    } else if (path2.type === "JSXText" || path2.parent && path2.parent.type.includes("JSX")) {
      replaceWithJSXI18nCall(path2, context, key);
    } else {
      replaceWithI18nCall(path2, context, key);
    }
    context.translations.set(key, value.trim());
  } catch (error) {
    context.index--;
    console.error("handleChineseString 中出错:", error);
  }
}
function handleStringWithDom(path2, context, isTemplateLiteral) {
  if (path2.type === "StringLiteral") {
    convertStringLiteralToTemplateLiteral(path2, context);
  } else if (isTemplateLiteral) {
    processTemplateElement(path2, context);
  }
}
function replaceWithJSXI18nCall(path2, context, key) {
  path2.replaceWith(
    t.jsxExpressionContainer(
      t.callExpression(t.identifier(context.config.scriptI18nCall), [
        t.stringLiteral(key)
      ])
    )
  );
}
function convertStringLiteralToTemplateLiteral(path2, context) {
  try {
    const stringLiteral = path2.node;
    const translatedString = handlerDomNode$1(stringLiteral.value, context);
    const parts = translatedString.split(/(\$\{[^}]+\})/);
    const quasis = [];
    const expressions = [];
    parts.forEach((part, index) => {
      if (part.startsWith("${") && part.endsWith("}")) {
        const exp = part.slice(2, -1);
        expressions.push(t.identifier(exp));
        if (index === 0) {
          quasis.push(t.templateElement({ raw: "", cooked: "" }));
        }
      } else {
        quasis.push(
          t.templateElement(
            { raw: part, cooked: part },
            index === parts.length - 1
            // 对最后一个元素为 true
          )
        );
      }
    });
    const templateLiteral = t.templateLiteral(quasis, expressions);
    templateLiteral.start = stringLiteral.start;
    templateLiteral.end = stringLiteral.end;
    templateLiteral.loc = stringLiteral.loc;
    path2.replaceWith(templateLiteral);
  } catch (error) {
    console.error(
      "convertStringLiteralToTemplateLiteral 函数中发生错误:",
      error
    );
  }
}
function handleJSXAttribute(path2, context) {
  if (path2.node.value && t.isStringLiteral(path2.node.value)) {
    handleChineseString(path2.get("value"), context);
  }
}
function handleJSXExpressionContainer(path2, context) {
  if (t.isStringLiteral(path2.node.expression)) {
    handleChineseString(path2.get("expression"), context);
  }
}
function isInDebugContext(path2) {
  const debugContexts = [
    (p) => p.isCallExpression() && p.get("callee").isMemberExpression() && p.get("callee.object").isIdentifier({ name: "console" }),
    (p) => p.isNewExpression() && p.get("callee").isIdentifier({ name: "Error" }) || p.isThrowStatement(),
    (p) => p.isCallExpression() && (p.get("callee").isIdentifier({ name: "assert" }) || p.get("callee").isMemberExpression() && p.get("callee.object").isIdentifier({ name: "assert" })),
    (p) => p.isDebuggerStatement()
  ];
  return debugContexts.some((context) => path2.findParent(context) !== null);
}
function replaceWithI18nCall(path2, context, key) {
  path2.replaceWith(
    t.callExpression(t.identifier(context.config.scriptI18nCall), [
      t.stringLiteral(key)
    ])
  );
}
function handleTemplateLiteral(path2, context, key) {
  const newExpression = t.callExpression(
    t.identifier(context.config.scriptI18nCall),
    [t.stringLiteral(key)]
  );
  const templateLiteral = path2.parentPath;
  newExpression.start = path2.node.start;
  const existingExpressions = templateLiteral.node.expressions.map((exp) => ({
    node: exp,
    start: exp.start
  }));
  const existingQuasis = templateLiteral.node.quasis.map((quasi) => ({
    node: quasi,
    start: quasi.start
  }));
  existingExpressions.push({ node: newExpression, start: path2.node.start });
  const sortedExpressions = existingExpressions.sort((a, b) => a.start - b.start).map((item) => item.node);
  const sortedQuasis = existingQuasis.sort((a, b) => a.start - b.start).map((item) => item.node);
  adjustQuasisAndExpressions(sortedQuasis, sortedExpressions);
  templateLiteral.node.expressions = sortedExpressions;
  templateLiteral.node.quasis = sortedQuasis;
  path2.node.value.raw = path2.node.value.cooked = "";
}
function adjustQuasisAndExpressions(sortedQuasis, sortedExpressions) {
  while (sortedQuasis.length < sortedExpressions.length + 1) {
    const isTail = sortedQuasis.length === sortedExpressions.length;
    const newQuasiStart = isTail ? sortedExpressions[sortedExpressions.length - 1].start + 1 : sortedExpressions[sortedQuasis.length - 1].start + 1;
    sortedQuasis.push(createQuasi(newQuasiStart, isTail));
  }
  while (sortedQuasis.length > sortedExpressions.length + 1) {
    sortedQuasis.pop();
  }
  sortedQuasis[sortedQuasis.length - 1].tail = true;
  sortedQuasis.sort((a, b) => a.start - b.start);
}
function createQuasi(start, tail = false) {
  const quasi = t.templateElement({ raw: "", cooked: "" }, tail);
  quasi.start = start;
  return quasi;
}
function processTemplateElement(path2, context) {
  const value = path2.node.value.raw || path2.node.value;
  const translatedString = handlerDomNode$1(value, context);
  path2.node.value = { raw: translatedString, cooked: translatedString };
}
function handlerDomNode$1(str, context) {
  if (!containsChinese$1(str)) {
    return str;
  }
  const splitArray = splitStringWithTags(str);
  let result = "";
  let hasChanges = false;
  for (const item of splitArray) {
    if (item.startsWith("<") && item.endsWith(">")) {
      result += item;
    } else {
      const processedItem = processTextContent(item, context);
      result += processedItem;
      if (processedItem !== item) {
        hasChanges = true;
      }
    }
  }
  return hasChanges ? result : str;
}
function processTextContent(text, context) {
  const regex = /(\${[^}]+})|([^$]+)/g;
  let result = "";
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      result += match[1];
    } else if (match[2] && containsChinese$1(match[2])) {
      const key = generateKey$1(context);
      context.translations.set(key, match[2].trim());
      result += `\${${context.config.scriptI18nCall}('${key}')}`;
    } else {
      result += match[2] || "";
    }
  }
  return result;
}
function splitStringWithTags(str) {
  const regex = /(<\/?[^>]+>)|([^<]+)/g;
  const result = [];
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match[1] || match[2]) {
      result.push(match[1] || match[2]);
    }
  }
  return result;
}
function addI18nImport(ast, context) {
  ast.program.body.unshift(
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier("i18n"))],
      t.stringLiteral(context.config.i18nImportPath)
    )
  );
}
const handleJsFile = createI18nProcessor$1(processJsAst$1);
var jsProcessor = {
  processJsAst: processJsAst$1,
  handleJsFile,
  handlerDomNode: handlerDomNode$1
};
const { parse: parseSfc } = require$$0$2;
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom
} = common;
const { processJsAst, handlerDomNode } = jsProcessor;
async function processVueAst(context) {
  try {
    context.config.autoImportI18n = false;
    const { descriptor } = parseSfc(context.contentSource);
    const templateAst = descriptor.template && descriptor.template.ast.children;
    const scriptAst = descriptor.script && descriptor.script.content;
    const scriptSetupAst = descriptor.scriptSetup && descriptor.scriptSetup.content;
    if (!templateAst) {
      return;
    }
    if (!(descriptor.template.attrs && descriptor.template.attrs.lang === "pug")) {
      await processVueTemplate(templateAst, context, descriptor);
    }
    context.templateSize = context.translations.size;
    await processVueScripts(scriptAst, scriptSetupAst, context);
    return context.translations.size > 0 ? context : void 0;
  } catch (error) {
    console.error("Error in processVueAst:", error);
    throw error;
  }
}
async function processVueTemplate(templateAst, context, descriptor) {
  try {
    const processedTemplate = processTemplate(templateAst, context);
    if (context.translations.size > 0) {
      const template = descriptor.template && descriptor.template.content || "";
      context.contentChanged = context.contentSource.replace(
        template,
        processedTemplate
      );
      context.contentSource = context.contentChanged;
    }
  } catch (error) {
    console.error("Error in processVueTemplate:", error);
    throw error;
  }
}
async function processVueScripts(scriptAst, scriptSetupAst, context) {
  context.config.autoImportI18n = true;
  if (scriptAst && containsChinese(scriptAst, true)) {
    await processVueScript(scriptAst, context, "script");
  }
  if (scriptSetupAst && containsChinese(scriptSetupAst, true)) {
    await processVueScript(scriptSetupAst, context, "scriptSetup");
  }
}
async function processVueScript(scriptAst, context, scriptType) {
  try {
    const prevChanged = context.contentChanged;
    processJsAst(context, scriptAst);
    const scriptChanged = context.contentChanged;
    context.contentChanged = prevChanged;
    if (scriptChanged) {
      const replaced = context.contentSource.replace(scriptAst, scriptChanged);
      context.contentChanged = replaced;
      context.contentSource = replaced;
    }
  } catch (error) {
    console.error(`Error in process ${scriptType}:`, error);
    throw error;
  }
}
function processTemplate(templateAst, context) {
  try {
    return astArrayToTemplate(templateAst, context);
  } catch (error) {
    console.error("Error in processTemplate:", error);
    throw error;
  }
}
function astArrayToTemplate(astArray, context) {
  try {
    return astArray.map((node) => astToTemplate(node, context)).join(" ");
  } catch (error) {
    console.error("Error in astArrayToTemplate:", error);
    return "";
  }
}
function astToTemplate(node, context) {
  try {
    if (typeof node === "string") return node;
    const nodeTypeHandlers = {
      3: () => node.loc.source,
      // Comment
      2: () => processTextNode(node, context),
      5: () => processInterpolationNode(node, context),
      1: () => processElementNode(node, context)
    };
    return nodeTypeHandlers[node.type] && nodeTypeHandlers[node.type]() || "";
  } catch (error) {
    console.error("Error in astToTemplate:", error);
    return "";
  }
}
function processTextNode(node, context) {
  if (containsChinese(node.content)) {
    const key = generateKey(context);
    context.translations.set(key, node.content.trim());
    return `{{${context.config.templateI18nCall}('${key}')}}`;
  }
  return node.content;
}
function processInterpolationNode(node, context) {
  if (!containsChinese(node.content.content)) return node.loc.source;
  if (node.content.ast) {
    let result = handlerForJs(node.content, context);
    return `{{${replaceForI18nCall(result, context)}}}`;
  } else {
    return `{{\`${interpolationStr(node.content.content, context)}\`}}`;
  }
}
function processElementNode(node, context) {
  let result = `<${node.tag}`;
  result += processAttributes(node.props, context);
  if (node.isSelfClosing) return result + " />";
  result += ">";
  if (node.children) {
    result += node.children.map((child) => astToTemplate(child, context)).join(" ");
  }
  return result + `</${node.tag}>`;
}
function processAttributes(props, context) {
  if (!props) return "";
  return props.map((prop) => {
    if (prop.type === 6) return processAttribute(prop, context);
    if (prop.type === 7) return processDirective(prop, context);
    return "";
  }).join(" ");
}
function processAttribute(prop, context) {
  if (!prop.value) return `
${prop.name}`;
  if (containsChinese(prop.value.content)) {
    if (stringWithDom(prop.value.content)) {
      const result = handlerDomNode(prop.value.content, context);
      return `
:${prop.name}="\`${replaceForI18nCall(result, context)}\`"`;
    } else {
      const key = generateKey(context);
      context.translations.set(key, prop.value.content.trim());
      return `
:${prop.name}="${context.config.templateI18nCall}('${key}')"`;
    }
  }
  return `
${prop.name}="${prop.value.content}"`;
}
function processDirective(prop, context) {
  let directiveName = getDirectiveName(prop);
  if (!prop.exp) return `
${directiveName}`;
  if (prop.exp.ast === null) {
    return " " + prop.loc.source;
  }
  if (!containsChinese(prop.exp.content)) {
    return `
${directiveName}="${prop.exp.content}"`;
  }
  let result;
  if (stringWithDom(prop.exp.content)) {
    const handlerContent = prop.exp.content.trim().replace(/^[\s\n]*[`'"]|[`'"][\s\n]*$/gm, "");
    result = handlerDomNode(handlerContent, context);
    return `
${directiveName}="\`${replaceForI18nCall(result, context)}\`"`;
  } else {
    result = handlerForJs(prop.exp, context);
    return `
${directiveName}="${replaceForI18nCall(result, context)}"`;
  }
}
function replaceForI18nCall(str, context) {
  return str.replace(
    new RegExp(context.config.scriptI18nCall, "g"),
    context.config.templateI18nCall
  );
}
function handlerForJs(node, context) {
  try {
    const { ast } = processJsAst(context, node.content.trim());
    if (ast) {
      return handleAstResult(ast, node, context);
    } else {
      return handleNonAstResult(node, context);
    }
  } catch (e) {
    console.error(`handlerForJs: ${e.message}`);
    return `
${node.content}`;
  }
}
function handleAstResult(ast, node, context) {
  if (node.ast.type === "StringLiteral" && ast.program.body.length === 0) {
    return handleStringLiteral(node, context);
  }
  const code = generateCode(ast, node.content.trim()).replace(
    /[,;](?=[^,;]*$)/,
    ""
  );
  return `
${code.replace(/"/g, "'")}`;
}
function handleStringLiteral(node, context) {
  if (containsChinese(node.content)) {
    const key = generateKey(context);
    context.translations.set(key, node.content.replace(/'/g, "").trim());
    return `
${context.config.templateI18nCall}('${key}')`;
  }
  return `
${node.content}`;
}
function handleNonAstResult(node, context) {
  const changeBefore = context.index;
  const getResult = replaceChineseWithI18nKey(node.content.trim(), context);
  return context.index > changeBefore ? getResult : `
${node.content}`;
}
function replaceChineseWithI18nKey(str, context) {
  return str.replace(/('[^']*[\u4e00-\u9fa5]+[^']*')/g, (match) => {
    const chineseContent = match.slice(1, -1);
    if (containsChinese(chineseContent)) {
      const key = generateKey(context);
      context.translations.set(key, chineseContent.trim());
      return `${context.config.templateI18nCall}('${key}')`;
    }
    return match;
  });
}
function getDirectiveName(prop) {
  if (prop.rawName) {
    return prop.rawName;
  }
  switch (prop.name) {
    case "bind":
      return ":";
    case "on":
      return "@";
    case "slot":
      return "#";
    default:
      return `v-${prop.name}`;
  }
}
function interpolationStr(strContent, context) {
  const parts = splitTemplateString(strContent);
  return parts.map((part) => {
    if (containsChinese(part)) {
      const key = generateKey(context);
      context.translations.set(key, part.trim());
      return `\${${context.config.templateI18nCall}('${key}')}`;
    }
    return part;
  }).join(" ");
}
function splitTemplateString(str) {
  str = str.replace(/^`|`$/g, "");
  const regex = /(\$\{[^}]*?\})|([^$]+|\$(?!\{))/g;
  return str.match(regex) || [];
}
const handleVueFile = createI18nProcessor(processVueAst);
var vueProcessor = {
  handleVueFile
};
(function(module2) {
  const path2 = require$$2;
  const fs2 = require$$1;
  const { TranslationManager: TranslationManager2 } = common;
  const { handleVueFile: handleVueFile2 } = vueProcessor;
  const { handleJsFile: handleJsFile2 } = jsProcessor;
  const { readConfig: readConfig2 } = setting$2;
  const prettier = require$$6;
  const { getRootPath: getRootPath2 } = utils;
  function getParserForFile(fileExt) {
    switch (fileExt.toLowerCase()) {
      case ".ts":
      case ".tsx":
        return "typescript";
      case ".vue":
        return "vue";
      default:
        return "babel";
    }
  }
  async function processFile2(filePath) {
    const fileExt = path2.extname(filePath).toLowerCase();
    const processor = getFileProcessor(fileExt);
    if (!processor) {
      return;
    }
    try {
      const config = readConfig2();
      const processResult = await processor(filePath, config);
      const { contentChanged, translations } = processResult || {};
      if (contentChanged) {
        let prettierConfig = null;
        const prettierConfigPath = path2.join(getRootPath2(), ".prettierrc.js");
        if (fs2.existsSync(prettierConfigPath)) {
          prettierConfig = require(prettierConfigPath);
        }
        try {
          const formatContent = await prettier.format(contentChanged, {
            parser: getParserForFile(fileExt),
            ...prettierConfig
          });
          await fs2.promises.writeFile(filePath, formatContent, "utf8");
          await outputTranslations(translations);
        } catch (error) {
          console.error(prettierConfig, contentChanged);
          console.error(`Error processing file ${filePath}:`, error);
        }
      } else {
        console.log(`No changes needed for: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
  function getFileProcessor(fileExt) {
    const processors = {
      ".vue": handleVueFile2,
      ".js": handleJsFile2,
      ".jsx": handleJsFile2,
      ".ts": handleJsFile2,
      ".tsx": handleJsFile2
    };
    return processors[fileExt] || null;
  }
  async function outputTranslations(translations) {
    const translationManager = new TranslationManager2();
    const config = readConfig2();
    await translationManager.outputTranslationFile(translations, config);
  }
  async function processDirectory(dir) {
    try {
      const files = await fs2.promises.readdir(dir);
      for (const file of files) {
        const filePath = path2.join(dir, file);
        const stat = await fs2.promises.stat(filePath);
        if (stat.isDirectory()) {
          await processDirectory(filePath);
        } else {
          await processFile2(filePath);
        }
      }
    } catch (error) {
      console.error(`Error processing directory ${dir}:`, error);
    }
  }
  async function main(inputPath) {
    try {
      const stat = await fs2.promises.stat(inputPath);
      if (stat.isDirectory()) {
        await processDirectory(inputPath);
      } else {
        await processFile2(inputPath);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      process.exit(1);
    }
  }
  if (require.main === module2) {
    const inputPath = process.argv[2];
    if (!inputPath) {
      console.error("Please provide a file or directory path as an argument.");
      process.exit(1);
    }
    main(inputPath).catch((error) => {
      console.error("An error occurred:", error);
      process.exit(1);
    });
  }
  module2.exports = { processFile: processFile2, processDirectory, main };
})(I18nProcessor);
var I18nProcessorExports = I18nProcessor.exports;
var switchLanguage$2 = {};
(function(exports2) {
  const vscode2 = require$$0;
  const fs2 = require$$1;
  const path2 = require$$2;
  const { readConfig: readConfig2 } = setting$2;
  const { getRootPath: getRootPath2 } = utils;
  let cachedLanguage = "zh.json";
  const getLanguagePack = async (language = cachedLanguage) => {
    const config = readConfig2();
    if (!config) {
      return;
    }
    const rootPath = getRootPath2();
    const i18nFilePath = path2.join(
      `${rootPath}${config.i18nFilePath}/locale/${language}`
    );
    if (!fs2.existsSync(i18nFilePath)) {
      if (language !== "zh.json") {
        vscode2.window.showInformationMessage(
          `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 ${language} 语言包文件，将使用默认语言包。`
        );
      }
      return;
    }
    const languagePack = await fs2.promises.readFile(i18nFilePath, "utf-8");
    if (!languagePack) {
      return;
    }
    try {
      const languagePackObj = JSON.parse(languagePack);
      return languagePackObj;
    } catch (error) {
      console.error(error);
    }
  };
  const buildRegexFromLanguagePack = (languagePackObj) => {
    const keys = Object.keys(languagePackObj);
    const escapedKeys = keys.map((key) => {
      return `\\b${key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}\\b`;
    });
    return new RegExp(`(${escapedKeys.join("|")})`, "g");
  };
  let decorationType;
  function getDecorationType() {
    if (!decorationType) {
      decorationType = vscode2.window.createTextEditorDecorationType({
        isWholeLine: true,
        rangeBehavior: vscode2.DecorationRangeBehavior.ClosedClosed,
        overviewRulerColor: "grey",
        overviewRulerLane: vscode2.OverviewRulerLane.Left,
        after: {
          margin: "0 0 0 5px"
          // 添加 margin 样式，这里设置为左右各 5 像素的边距
        }
      });
    }
    return decorationType;
  }
  exports2.updateDecorations = async (language = cachedLanguage) => {
    const config = readConfig2();
    if (!config) {
      return;
    }
    const editor = vscode2.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const fileExt = path2.extname(editor.document.fileName).toLowerCase();
    if ((config.excludedExtensions || []).some(
      (ext) => ext.toLowerCase() === fileExt
    )) {
      return;
    }
    const languagePackObj = await getLanguagePack(language);
    if (!languagePackObj) {
      return;
    }
    const foregroundColor = new vscode2.ThemeColor("editorCodeLens.foreground");
    if (editor) {
      const regex = buildRegexFromLanguagePack(languagePackObj);
      const decorations = [];
      for (let i = 0; i < editor.document.lineCount; i++) {
        const line = editor.document.lineAt(i);
        const text = line.text;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const contentText = languagePackObj[match[0]];
          if (!contentText) {
            continue;
          }
          decorations.push({
            range: new vscode2.Range(
              i,
              match.index,
              i,
              match.index + match[0].length
            ),
            renderOptions: {
              after: {
                contentText,
                color: foregroundColor,
                opacity: "0.6"
              }
            }
          });
        }
      }
      editor.setDecorations(getDecorationType(), decorations);
    }
  };
  exports2.switchLanguage = async () => {
    const config = readConfig2(true);
    const rootPath = getRootPath2();
    const allFiles = fs2.readdirSync(`${rootPath}${config.i18nFilePath}/locale`);
    const languageFiles = allFiles.filter((file) => file.endsWith(".json"));
    if (!languageFiles.length) {
      vscode2.window.showInformationMessage(
        `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到语言包文件，请先扫描中文`
      );
      return;
    }
    vscode2.window.showQuickPick(languageFiles).then(async (item) => {
      if (item) {
        cachedLanguage = item;
        await exports2.updateDecorations(item);
      }
    });
  };
})(switchLanguage$2);
const vscode$6 = require$$0;
const { processFile: processFile$1 } = I18nProcessorExports;
const { updateDecorations: updateDecorations$2 } = switchLanguage$2;
scanChinese$3.scanChinese = async (filePath = void 0) => {
  if (!filePath) {
    const editor = vscode$6.window.activeTextEditor;
    if (!editor) return;
    const fsPath = editor.document.uri.fsPath;
    if (!/\.[a-zA-Z0-9]+$/.test(fsPath)) return;
    filePath = fsPath;
  }
  await processFile$1(filePath);
  setTimeout(() => {
    updateDecorations$2();
  }, 300);
};
var scanChineseBatch$2 = {};
const vscode$5 = require$$0;
const fs$1 = require$$1;
const path = require$$2;
const { readConfig: readConfig$5 } = setting$2;
const { scanChinese: scanChinese$2 } = scanChinese$3;
scanChineseBatch$2.scanChineseBatch = async () => {
  const config = readConfig$5(true);
  const folder = await vscode$5.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false
  });
  if (!folder || folder.length === 0) {
    return;
  }
  const folderPath = folder[0].fsPath;
  const excludedExtensions = [...config.excludedExtensions];
  const files = getAllFilesInFolder(folderPath, excludedExtensions);
  const fileCount = files.length;
  await vscode$5.window.withProgress(
    {
      location: vscode$5.ProgressLocation.Notification,
      title: "正在批量扫描中文",
      cancellable: false
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
            Math.floor(processedCount / fileCount * totalSteps),
            totalSteps
          );
          if (currentStep > lastReportedStep) {
            progress.report({ increment: currentStep - lastReportedStep });
            lastReportedStep = currentStep;
          }
        }
      }
    }
  );
};
function getAllFilesInFolder(folderPath, excludedExtensions) {
  const files = [];
  const entries = fs$1.readdirSync(folderPath);
  for (const item of entries) {
    const itemPath = path.join(folderPath, item);
    if (item === "node_modules") {
      continue;
    }
    const stat = fs$1.statSync(itemPath);
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
async function processFile(filePath) {
  const support = /* @__PURE__ */ new Set([".js", ".jsx", ".ts", ".tsx", ".vue"]);
  const ext = path.extname(filePath).toLowerCase();
  if (!support.has(ext)) return;
  await scanChinese$2(filePath);
}
var generateLanguagePackage$2 = {};
var baidu = {};
const axios$1 = require$$0$3;
const md5 = require$$1$2;
const { readConfig: readConfig$4 } = setting$2;
const generateSign = (appid, q, salt, secretKey) => {
  return md5(appid + q + salt + secretKey);
};
baidu.baiduTranslateApi = async (q, language = "en") => {
  const config = readConfig$4();
  if (!config) {
    console.error("未找到配置文件");
    return;
  }
  const { appid, secretKey } = config.baidu;
  const salt = (/* @__PURE__ */ new Date()).getTime();
  const res = await axios$1({
    method: "post",
    url: "https://fanyi-api.baidu.com/api/trans/vip/translate",
    params: {
      q,
      from: "auto",
      to: language,
      appid,
      salt,
      sign: generateSign(appid, q, salt, secretKey)
    }
  });
  return res.data;
};
const vscode$4 = require$$0;
const { baiduTranslateApi } = baidu;
let BaiduTranslator$1 = class BaiduTranslator {
  async translate(arr, language) {
    const text = arr.join("\n");
    const data = await baiduTranslateApi(text, language);
    if (data.error_code) {
      vscode$4.window.showErrorMessage(
        `百度翻译失败，错误码：${data.error_code}，请打开百度翻译官网查看错误信息：https://api.fanyi.baidu.com/doc/21`
      );
      return null;
    }
    return data.trans_result;
  }
};
var baiduTranslator = BaiduTranslator$1;
var deepl = {};
const axios = require$$0$3;
const { readConfig: readConfig$3 } = setting$2;
deepl.deeplTranslateApi = async (text, targetLanguage = "en") => {
  const config = readConfig$3();
  if (!config) {
    console.error("未找到配置文件");
    return { error: "未找到配置文件" };
  }
  const { authKey, isPro } = config.deepl;
  if (!authKey) {
    console.error("未配置 DeepL 认证密钥");
    return { error: "未配置 DeepL 认证密钥" };
  }
  const targetLang = targetLanguage.toUpperCase();
  const baseUrl = isPro ? "https://api.deepl.com/v2/translate" : "https://api-free.deepl.com/v2/translate";
  try {
    const textArray = text.split("\n").filter((line) => line.trim() !== "");
    const response = await axios({
      method: "post",
      url: baseUrl,
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        "Content-Type": "application/json"
      },
      data: {
        text: textArray,
        source_lang: "ZH",
        target_lang: targetLang,
        preserve_formatting: true,
        split_sentences: "nonewlines"
      }
    });
    const translations = response.data.translations.map(
      (translation, index) => ({
        src: textArray[index] || "",
        dst: translation.text
      })
    );
    return {
      trans_result: translations
    };
  } catch (error) {
    console.error(
      "DeepL 翻译错误:",
      error.response && error.response.data || error.message
    );
    return {
      error_code: error.response && error.response.status || "UNKNOWN_ERROR",
      error_msg: error.response && error.response.data && error.response.data.message || error.message
    };
  }
};
const vscode$3 = require$$0;
const { deeplTranslateApi } = deepl;
let DeeplTranslator$1 = class DeeplTranslator {
  async translate(arr, language) {
    const text = Array.isArray(arr) ? arr.join("\n") : String(arr || "");
    const data = await deeplTranslateApi(text, language);
    if (data.error_code || data.error) {
      vscode$3.window.showErrorMessage(
        `DeepL 翻译失败：${data.error_msg || data.error}`
      );
      return null;
    }
    return data.trans_result;
  }
};
var deeplTranslator = DeeplTranslator$1;
var freeGoogle = {};
const { translate } = require$$0$4;
freeGoogle.googleTranslateApi = async (q, language = "en") => {
  try {
    const { text } = await translate(q, { to: language });
    return {
      trans_result: [{ dst: text }]
    };
  } catch (error) {
    console.error("Google translate error:", error);
    if (error.name === "TooManyRequestsError") {
      return {
        error_code: "429",
        error_msg: "免费谷歌翻译请求频率超限，请稍后重试",
        error_type: "RATE_LIMIT",
        suggestion: "建议降低翻译频率或使用其他翻译服务",
        original_error: error.message
      };
    }
    return {
      error_code: "500",
      error_msg: "免费谷歌翻译服务异常",
      error_type: error.name || "UNKNOWN_ERROR",
      original_error: error.message,
      stack: error.stack
    };
  }
};
const vscode$2 = require$$0;
const { googleTranslateApi } = freeGoogle;
let GoogleTranslator$1 = class GoogleTranslator {
  async translate(arr, language) {
    const trans_result = [];
    for (const text of arr) {
      const data = await googleTranslateApi(text, language);
      if (data.error_code) {
        vscode$2.window.showErrorMessage(
          `免费谷歌翻译失败，错误码：${data.error_code}，请稍后重试`
        );
        trans_result.push({ dst: "" });
      } else {
        trans_result.push(data.trans_result[0]);
      }
    }
    return trans_result;
  }
};
var googleTranslator = GoogleTranslator$1;
const BaiduTranslator2 = baiduTranslator;
const DeeplTranslator2 = deeplTranslator;
const GoogleTranslator2 = googleTranslator;
const translators = {
  baidu: BaiduTranslator2,
  deepl: DeeplTranslator2,
  freeGoogle: GoogleTranslator2
};
function createTranslator$1(serviceName) {
  const Translator = translators[serviceName];
  if (!Translator) {
    throw new Error(`未找到 ${serviceName} 翻译服务`);
  }
  return new Translator();
}
var translators_1 = {
  createTranslator: createTranslator$1
};
const fs = require$$1;
const vscode$1 = require$$0;
const { getRootPath } = utils;
const { readConfig: readConfig$2 } = setting$2;
const { createTranslator } = translators_1;
const TRANSLATE_LIMIT = 20;
generateLanguagePackage$2.generateLanguagePackage = async () => {
  const config = readConfig$2(true, true);
  const zhPath = `${getRootPath()}${config.i18nFilePath}/locale/zh.json`;
  if (!fs.existsSync(zhPath)) {
    vscode$1.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件，请先扫描中文`
    );
    return;
  }
  const hasBaiduConfig = config.baidu && config.baidu.appid && config.baidu.secretKey;
  const hasDeeplConfig = config.deepl && config.deepl.authKey;
  const hasFreeGoogleConfig = config.freeGoogle;
  if (!hasBaiduConfig && !hasDeeplConfig && !hasFreeGoogleConfig) {
    vscode$1.window.showInformationMessage(
      `未配置翻译服务，请先在配置文件中配置百度翻译、DeepL翻译或免费谷歌翻译的相关信息`
    );
    const configFilePath = getRootPath() + "/automatically-i18n-config.json";
    vscode$1.workspace.openTextDocument(configFilePath).then((document) => {
      vscode$1.window.showTextDocument(document);
    });
    return;
  }
  let translateService = "";
  const serviceOptions = [];
  if (hasBaiduConfig) {
    serviceOptions.push({ label: "百度翻译", value: "baidu" });
  }
  if (hasDeeplConfig) {
    serviceOptions.push({ label: "DeepL 翻译", value: "deepl" });
  }
  if (hasFreeGoogleConfig) {
    serviceOptions.push({ label: "免费谷歌翻译", value: "freeGoogle" });
  }
  if (serviceOptions.length > 1) {
    const selectedService = await vscode$1.window.showQuickPick(serviceOptions, {
      placeHolder: "请选择翻译服务"
    });
    if (!selectedService) return;
    translateService = selectedService.value;
  } else if (serviceOptions.length === 1) {
    translateService = serviceOptions[0].value;
  }
  const translator = createTranslator(translateService);
  const languageInput = await vscode$1.window.showInputBox({
    prompt: "请输入语言包名称",
    value: "en"
  });
  const language = languageInput || "en";
  const zhString = await fs.promises.readFile(zhPath, "utf-8");
  if (!zhString) return;
  const zhJson = JSON.parse(zhString);
  const zhJsonKeys = Object.keys(zhJson);
  let existingLanguageJson = {};
  const existingLanguagePath = `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`;
  if (fs.existsSync(existingLanguagePath)) {
    const existingLanguageString = await fs.promises.readFile(
      existingLanguagePath,
      "utf-8"
    );
    existingLanguageJson = JSON.parse(existingLanguageString);
  }
  const keysToTranslate = [];
  const valuesToTranslate = [];
  zhJsonKeys.forEach((key) => {
    if (!existingLanguageJson[key]) {
      keysToTranslate.push(key);
      valuesToTranslate.push(zhJson[key]);
    }
  });
  if (keysToTranslate.length === 0) {
    vscode$1.window.showInformationMessage(`${language} 语言包已经全部翻译完成`);
    return;
  }
  const valuesToTranslateLengthgroup = Math.ceil(
    valuesToTranslate.length / TRANSLATE_LIMIT
  );
  const newLanguageJson = JSON.parse(JSON.stringify(existingLanguageJson));
  const serviceNames = {
    baidu: "百度翻译",
    deepl: "DeepL 翻译",
    freeGoogle: "免费谷歌翻译"
  };
  await vscode$1.window.withProgress(
    {
      location: vscode$1.ProgressLocation.Notification,
      title: `正在使用${serviceNames[translateService]}生成${language}语言包`,
      cancellable: false
    },
    async (progress) => {
      progress.report({ increment: 0 });
      for (let i = 0; i < valuesToTranslateLengthgroup; i++) {
        const progressPercentage = (i + 1) / valuesToTranslateLengthgroup * 100;
        progress.report({ increment: progressPercentage });
        const valuesToTranslateLengthgroupArrItem = valuesToTranslate.slice(
          i * TRANSLATE_LIMIT,
          (i + 1) * TRANSLATE_LIMIT
        );
        const trans_result = await translator.translate(
          valuesToTranslateLengthgroupArrItem,
          language
        );
        if (!trans_result) {
          continue;
        }
        trans_result.forEach((item, index) => {
          const key = keysToTranslate[i * TRANSLATE_LIMIT + index];
          newLanguageJson[key] = item.dst;
        });
        const orderedLanguageJson = {};
        zhJsonKeys.forEach((key) => {
          if (newLanguageJson[key] !== void 0) {
            orderedLanguageJson[key] = newLanguageJson[key];
          }
        });
        await fs.promises.writeFile(
          `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
          JSON.stringify(orderedLanguageJson, null, 2)
        );
      }
    }
  );
};
const { setting: setting$1, readConfig: readConfig$1 } = setting$2;
const { scanChinese: scanChinese$1 } = scanChinese$3;
const { scanChineseBatch: scanChineseBatch$1 } = scanChineseBatch$2;
const { switchLanguage: switchLanguage$1, updateDecorations: updateDecorations$1 } = switchLanguage$2;
const {
  generateLanguagePackage: generateLanguagePackage$1
} = generateLanguagePackage$2;
var script = {
  setting: setting$1,
  readConfig: readConfig$1,
  scanChinese: scanChinese$1,
  scanChineseBatch: scanChineseBatch$1,
  switchLanguage: switchLanguage$1,
  updateDecorations: updateDecorations$1,
  generateLanguagePackage: generateLanguagePackage$1
};
const vscode = require$$0;
const {
  setting,
  readConfig,
  scanChinese,
  scanChineseBatch,
  switchLanguage,
  updateDecorations,
  generateLanguagePackage
} = script;
var activate = extension.activate = (context) => {
  vscode.window.onDidChangeVisibleTextEditors(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });
  vscode.workspace.onDidSaveTextDocument(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.scanChinese",
      async () => {
        readConfig(true, true);
        scanChinese();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.scanChineseBatch",
      async () => {
        readConfig(true, true);
        scanChineseBatch();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.generateLanguagePackage",
      async () => {
        generateLanguagePackage();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.switchLanguage",
      switchLanguage
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.updateLocalLangPackage",
      async () => {
        updateDecorations();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.automatically.i18n.setting",
      async () => {
        setting();
      }
    )
  );
};
exports.activate = activate;
exports.default = extension;
