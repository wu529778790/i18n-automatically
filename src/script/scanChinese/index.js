const vscode = require("vscode");
const path = require("path");
const { parse: parseSfc } = require("@vue/compiler-sfc");
const { parse: parseTemplate } = require("@vue/compiler-dom");
const { parse: babelParse } = require("@babel/parser");
const { getConfig } = require("../setting.js");
const { updateDecorations } = require("../switchLanguage.js");
const {
  generateUniqueId,
  readFileContent,
  saveFileContent,
} = require("../../utils/index.js");
import { traverseTemplate } from "./traverseTemplate.js";
import { traverseScript } from "./traverseScript.js";
import { saveChineseTexts, clearChineseTexts } from "./collectChineseText.js";

let hasI18nUsageInScript = false;
let hasI18nUsageInScriptSetup = false;

/**
 * 扫描中文
 * @param {string} filePath 文件路径
 */
exports.scanChinese = async (filePath = undefined) => {
  hasI18nUsageInScript = false;
  hasI18nUsageInScriptSetup = false;
  try {
    const config = getConfig(true);
    let currentFilePath;
    if (!filePath) {
      currentFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
      filePath = currentFilePath;
    }
    const fileExtension = path.extname(filePath);
    if (config.excludedExtensions.includes(fileExtension)) return;
    const fileUuid = generateUniqueId();
    let script;
    let text;
    let autoImportI18n;

    if (fileExtension === ".vue") {
      text = await readFileContent(filePath);
      const { descriptor } = parseSfc(text);
      const template = descriptor.template ? descriptor.template.content : "";
      script = descriptor.script ? descriptor.script.content : "";
      const scriptSetup = descriptor.scriptSetup
        ? descriptor.scriptSetup.content
        : "";
      const templateAst = parseTemplate(template);
      const scriptSetupAst = babelParse(scriptSetup, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });

      if (templateAst) {
        const modifiedTemplate = traverseTemplate(
          templateAst,
          template,
          filePath,
          fileUuid,
          config
        );
        text = text.replace(template, modifiedTemplate);
      }
      // script setup标签的
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
          hasI18nUsageInScript,
          hasI18nUsageInScriptSetup
        );
        const alreadyImported = modifiedScript.match(
          /import\s+(?:i18n)\s+from\s+['"].*['"]/
        );
        if (!alreadyImported && hasI18nUsageInScriptSetup) {
          autoImportI18n = `\n${config.autoImportI18n}`;
          modifiedScript = autoImportI18n + modifiedScript;
        }
        text = text.replace(scriptSetup, modifiedScript);
      }
      // script标签的
      if (script) {
        autoImportI18n = `\n${config.autoImportI18n}`;
      }
    } else {
      // 纯js
      autoImportI18n = `${config.autoImportI18n}\n`;
      text = await readFileContent(filePath);
      script = text;
    }

    const scriptAst = babelParse(script, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    if (scriptAst && scriptAst.program && scriptAst.program.body.length > 0) {
      let modifiedScript = traverseScript(
        scriptAst,
        script,
        filePath,
        fileUuid,
        config,
        hasI18nUsageInScript,
        hasI18nUsageInScriptSetup
      );
      const alreadyImported = modifiedScript.match(
        /import\s+(?:i18n)\s+from\s+['"].*['"]/
      );
      if (!alreadyImported && hasI18nUsageInScript) {
        modifiedScript = autoImportI18n + modifiedScript;
      }
      text = text.replace(script, modifiedScript);
    }

    await saveFileContent(filePath, text);
    await saveChineseTexts(config);

    if (filePath === currentFilePath) {
      setTimeout(() => {
        updateDecorations();
      }, 300);
    }
    await clearChineseTexts();
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
