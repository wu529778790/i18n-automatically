const vscode = require("vscode");
const { generateUniqueId } = require("../utils/index.js");

const chineseTexts = {};
let index = 0;
const collectChineseText = (content) => {
  if (Object.prototype.toString.call(content) !== "[object String]") {
    return;
  }
  console.error("collectChineseText", content);
  content = content.trim();
  chineseTexts[`${index}`] = content;
  index++;
};

/**
 * 扫描中文
 * @returns {Promise<void>}
 */
exports.scanChinese = async () => {
  try {
    // 异步读取文件内容

    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const text = document.getText();
    const fileName = document.fileName;
    const fileUUid = generateUniqueId();

    const { parse } = require("@vue/compiler-sfc");
    const { descriptor } = parse(text);
    // 解析 Vue 文件
    const template = descriptor.template ? descriptor.template.content : "";
    // const script = descriptor.script ? descriptor.script.content : "";
    // const scriptSetup = descriptor.scriptSetup
    //   ? descriptor.scriptSetup.content
    //   : "";
    // 解析模板
    const { compileTemplate } = require("@vue/compiler-sfc");
    const { ast } = compileTemplate({
      source: template,
      filename: fileName,
      id: new Date().getTime().toString(),
    });

    const traverseTemplate = (ast) => {
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
                if (
                  prop.type === 1 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                }
                // Interpolation Node（插值节点
                if (
                  prop.type === 2 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                }
                // Text Node（文本节点
                if (
                  prop.type === 3 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                }
                // Comment Node（注释节点）
                if (
                  prop.type === 4 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                }
                // Attribute Node（属性节点）
                if (
                  prop.type === 6 &&
                  prop.value &&
                  prop.value.content &&
                  chineseRegex.test(prop.value.content)
                ) {
                  collectChineseText(prop.value.content);
                }
                // Directive Node（指令节点）
                if (prop.type === 7 && chineseRegex.test(prop.content)) {
                  collectChineseText(prop.content);
                }
              });
            }
            if (node.children) {
              node.children.forEach(traverseNode);
            }
            break;

          case 2: // Text Node（文本节点）
          case 5: // Interpolation Node（插值节点）
          case 12: // Interpolation Node（插值节点）
            if (chineseRegex.test(node.loc.source)) {
              collectChineseText(node.loc.source);
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
            console.log("----------", node);
            break;
        }
      };

      traverseNode(ast);
    };

    traverseTemplate(ast);
    console.log("chineseTexts", chineseTexts);

    // 解析脚本
    // const parser = require("@babel/parser");
    // const scriptAst = parser.parse(script, {
    //   sourceType: "module",
    //   plugins: ["jsx", "typescript"],
    // });

    // const scriptSetupAst = parser.parse(scriptSetup, {
    //   sourceType: "module",
    //   plugins: ["jsx", "typescript"],
    // });
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
