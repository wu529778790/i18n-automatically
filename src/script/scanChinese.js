const vscode = require("vscode");
const { generateUniqueId } = require("../utils/index.js");
const { parse: parseSfc } = require("@vue/compiler-sfc");
const {
  parse: parseTemplate,
  compile: compileDom,
  generate: generateDom,
} = require("@vue/compiler-dom");
const { parse: babelParse } = require("@babel/parser");
const { default: generate } = require("@babel/generator");

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
    const editor = vscode.window.activeTextEditor;
    const document = editor.document;
    const text = document.getText();
    const fileUUid = generateUniqueId();

    const { descriptor } = parseSfc(text);
    // 解析 Vue 文件
    const template = descriptor.template ? descriptor.template.content : "";
    const script = descriptor.script ? descriptor.script.content : "";
    const scriptSetup = descriptor.scriptSetup
      ? descriptor.scriptSetup.content
      : "";
    // 解析模板
    const templateAst = parseTemplate(template);

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
                  // prop.content = prop.content.replace(chineseRegex, fileUUid);
                }
                // Interpolation Node（插值节点）
                if (
                  prop.type === 2 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                  // prop.content = prop.content.replace(chineseRegex, fileUUid);
                }
                // Text Node（文本节点）
                if (
                  prop.type === 3 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                  // prop.content = prop.content.replace(chineseRegex, fileUUid);
                }
                // Comment Node（注释节点）
                if (
                  prop.type === 4 &&
                  prop.content &&
                  chineseRegex.test(prop.content)
                ) {
                  collectChineseText(prop.content);
                  // prop.content = prop.content.replace(chineseRegex, fileUUid);
                }
                // Attribute Node（属性节点）
                if (
                  prop.type === 6 &&
                  prop.value &&
                  prop.value.content &&
                  chineseRegex.test(prop.value.content)
                ) {
                  collectChineseText(prop.value.content);
                  // prop.value.content = prop.value.content.replace(
                  //   chineseRegex,
                  //   fileUUid
                  // );
                }
                // Directive Node（指令节点）
                if (prop.type === 7 && chineseRegex.test(prop.content)) {
                  collectChineseText(prop.content);
                  // prop.content = prop.content.replace(chineseRegex, fileUUid);
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
              node.loc.source = node.loc.source.replace(chineseRegex, fileUUid);
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

    traverseTemplate(templateAst);
    console.log("chineseTexts", chineseTexts);

    // 解析脚本部分
    const scriptAst = babelParse(script, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const scriptSetupAst = babelParse(scriptSetup, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    // 遍历脚本AST并修改中文文本
    const traverseScript = (ast) => {
      const traverseNode = (node) => {
        const chineseRegex = /[\u4e00-\u9fa5]/;
        if (node.type === "StringLiteral" && chineseRegex.test(node.value)) {
          collectChineseText(node.value);
          node.value = node.value.replace(chineseRegex, fileUUid);
        }
        if (node.type === "TemplateLiteral" && node.quasis) {
          node.quasis.forEach((quasi) => {
            if (chineseRegex.test(quasi.value.raw)) {
              collectChineseText(quasi.value.raw);
              quasi.value.raw = quasi.value.raw.replace(chineseRegex, fileUUid);
            }
          });
        }
        if (node.type === "JSXText" && chineseRegex.test(node.value)) {
          collectChineseText(node.value);
          node.value = node.value.replace(chineseRegex, fileUUid);
        }
        if (node.type === "JSXElement" && node.children) {
          node.children.forEach(traverseNode);
        }
        if (
          node.type === "JSXAttribute" &&
          node.value &&
          node.value.type === "StringLiteral" &&
          chineseRegex.test(node.value.value)
        ) {
          collectChineseText(node.value.value);
          node.value.value = node.value.value.replace(chineseRegex, fileUUid);
        }
        if (
          node.type === "ExpressionStatement" &&
          node.expression &&
          node.expression.type === "CallExpression" &&
          node.expression.arguments
        ) {
          node.expression.arguments.forEach(traverseNode);
        }
        if (node.type === "ObjectExpression" && node.properties) {
          node.properties.forEach(traverseNode);
        }
        if (node.type === "ArrayExpression" && node.elements) {
          node.elements.forEach(traverseNode);
        }
        if (node.type === "FunctionDeclaration" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "BlockStatement" && node.body) {
          node.body.forEach(traverseNode);
        }
        if (node.type === "ReturnStatement" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "IfStatement" && node.consequent) {
          traverseNode(node.consequent);
        }
        if (node.type === "IfStatement" && node.alternate) {
          traverseNode(node.alternate);
        }
        if (node.type === "ForStatement" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "WhileStatement" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "DoWhileStatement" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "SwitchStatement" && node.cases) {
          node.cases.forEach(traverseNode);
        }
        if (node.type === "SwitchCase" && node.consequent) {
          node.consequent.forEach(traverseNode);
        }
        if (node.type === "TryStatement" && node.block) {
          traverseNode(node.block);
        }
        if (node.type === "CatchClause" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "VariableDeclaration" && node.declarations) {
          node.declarations.forEach(traverseNode);
        }
        if (node.type === "VariableDeclarator" && node.init) {
          traverseNode(node.init);
        }
        if (node.type === "AssignmentExpression" && node.right) {
          traverseNode(node.right);
        }
        if (node.type === "LogicalExpression" && node.left) {
          traverseNode(node.left);
        }
        if (node.type === "LogicalExpression" && node.right) {
          traverseNode(node.right);
        }
        if (node.type === "ConditionalExpression" && node.consequent) {
          traverseNode(node.consequent);
        }
        if (node.type === "ConditionalExpression" && node.alternate) {
          traverseNode(node.alternate);
        }
        if (node.type === "SequenceExpression" && node.expressions) {
          node.expressions.forEach(traverseNode);
        }
        if (node.type === "UnaryExpression" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "BinaryExpression" && node.left) {
          traverseNode(node.left);
        }
        if (node.type === "BinaryExpression" && node.right) {
          traverseNode(node.right);
        }
        if (node.type === "MemberExpression" && node.object) {
          traverseNode(node.object);
        }
        if (node.type === "MemberExpression" && node.property) {
          traverseNode(node.property);
        }
        if (node.type === "CallExpression" && node.arguments) {
          node.arguments.forEach(traverseNode);
        }
        if (node.type === "NewExpression" && node.arguments) {
          node.arguments.forEach(traverseNode);
        }
        if (node.type === "UpdateExpression" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "AwaitExpression" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "YieldExpression" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "ArrowFunctionExpression" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "ClassDeclaration" && node.body) {
          traverseNode(node.body);
        }
        if (node.type === "ClassBody" && node.body) {
          node.body.forEach(traverseNode);
        }
        if (node.type === "MethodDefinition" && node.value) {
          traverseNode(node.value);
        }
        if (node.type === "Property" && node.value) {
          traverseNode(node.value);
        }
        if (node.type === "ObjectPattern" && node.properties) {
          node.properties.forEach(traverseNode);
        }
        if (node.type === "ArrayPattern" && node.elements) {
          node.elements.forEach(traverseNode);
        }
        if (node.type === "RestElement" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "AssignmentPattern" && node.right) {
          traverseNode(node.right);
        }
        if (node.type === "SpreadElement" && node.argument) {
          traverseNode(node.argument);
        }
        if (node.type === "TemplateElement" && node.value) {
          traverseNode(node.value);
        }
        if (node.type === "TaggedTemplateExpression" && node.quasi) {
          traverseNode(node.quasi);
        }
        if (node.type === "MetaProperty" && node.meta) {
          traverseNode(node.meta);
        }
        if (node.type === "MetaProperty" && node.property) {
          traverseNode(node.property);
        }
        if (node.type === "ImportDeclaration" && node.specifiers) {
          node.specifiers.forEach(traverseNode);
        }
        if (node.type === "ImportSpecifier" && node.imported) {
          traverseNode(node.imported);
        }
        if (node.type === "ImportDefaultSpecifier" && node.local) {
          traverseNode(node.local);
        }
        if (node.type === "ImportNamespaceSpecifier" && node.local) {
          traverseNode(node.local);
        }
        if (node.type === "ExportNamedDeclaration" && node.declaration) {
          traverseNode(node.declaration);
        }
        if (node.type === "ExportDefaultDeclaration" && node.declaration) {
          traverseNode(node.declaration);
        }
        if (node.type === "ExportAllDeclaration" && node.source) {
          traverseNode(node.source);
        }
        if (node.type === "ExportSpecifier" && node.exported) {
          traverseNode(node.exported);
        }
        if (node.type === "ExportSpecifier" && node.local) {
          traverseNode(node.local);
        }
        if (node.type === "Program" && node.body) {
          node.body.forEach(traverseNode);
        }
      };

      traverseNode(ast);
    };

    traverseScript(scriptAst);
    traverseScript(scriptSetupAst);

    // 将修改后的模板AST转换为字符串
    const templateCode = generateDom(templateAst).code;
    console.log("templateCode", templateCode);

    const scriptCode = generate(scriptAst).code;
    const scriptSetupCode = generate(scriptSetupAst).code;

    // 将字符串写回到文件中
    const edit = new vscode.WorkspaceEdit();
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    const textRange = new vscode.Range(
      firstLine.range.start,
      lastLine.range.end
    );
    const newText = text
      .replace(template, templateCode)
      .replace(script, scriptCode)
      .replace(scriptSetup, scriptSetupCode);
    edit.replace(document.uri, textRange, newText);
    await vscode.workspace.applyEdit(edit);
    await document.save();
  } catch (error) {
    console.error(`发生未知错误：${error}`);
  }
};
