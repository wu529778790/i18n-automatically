const vscode = require("vscode");

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

    const { parse } = require("@vue/compiler-sfc");
    const { descriptor } = parse(text);
    // 解析 Vue 文件
    const template = descriptor.template ? descriptor.template.content : "";
    const script = descriptor.script ? descriptor.script.content : "";
    const scriptSetup = descriptor.scriptSetup
      ? descriptor.scriptSetup.content
      : "";
    // 解析模板
    const { compileTemplate } = require("@vue/compiler-sfc");
    const { ast } = compileTemplate({
      source: template,
      filename: fileName,
      id: new Date().getTime().toString(),
    });
    // 遍历模板 AST
    const traverseTemplate = (ast) => {
      const chineseRegex = /[\u4e00-\u9fa5]+/g;
      const chineseTexts = [];

      const traverseNode = (node) => {
        console.log(node);

        if (node.type === 0) {
          // 根节点
          if (node.children) {
            node.children.forEach((child) => traverseNode(child));
          }
        } else if (node.type === 2) {
          // 文本节点
          if (node.content && chineseRegex.test(node.content)) {
            console.log("文本节点", node.content);
            chineseTexts.push({
              value: node.content,
              start: node.loc.start.offset,
              end: node.loc.end.offset,
            });
          }
        } else if (node.type === 1) {
          // 元素节点
          if (node.children) {
            node.children.forEach((child) => traverseNode(child));
          }
          if (node.props) {
            console.log("props", node.props);
            // 处理组件属性
            node.props.forEach((prop) => {
              console.log("prop", prop);
              if (prop.type === 6 && prop.value && prop.value.content) {
                console.log(prop.value.content, typeof prop.value.content);
                const test = chineseRegex.test(prop.value.content);
                console.log("test", test);

                if (test) {
                  console.log("属性值", prop.value.content);
                  chineseTexts.push({
                    value: prop.value.content,
                    start: prop.value.loc.start.offset,
                    end: prop.value.loc.end.offset,
                  });
                }
              }
            });
          }
        }
      };

      traverseNode(ast);
      return chineseTexts;
    };

    const templateChineseTexts = traverseTemplate(ast);
    console.log("templateChineseTexts", templateChineseTexts);

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
