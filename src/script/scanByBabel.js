const { customLog } = require('../utils/index.js');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const { JSDOM } = require('jsdom');
const fs = require('fs');

let filePathGet, fileUuidGet, configGet, generateUUIDFn;

// 处理模板字符串或普通字符串中的中文字符
function handleChineseString(
  path,
  translations,
  index,
  isTemplateLiteral = false,
) {
  const value = isTemplateLiteral ? path.node.value.raw : path.node.value;

  if (!/[\u4e00-\u9fa5]/.test(value)) {
    return index;
  }

  const isInConsoleCall = path.findParent(
    (p) =>
      p.isCallExpression() &&
      p.get('callee').isMemberExpression() &&
      p.get('callee.object').isIdentifier({ name: 'console' }),
  );

  if (isInConsoleCall) {
    return index;
  }

  const key = generateUUIDFn(filePathGet, fileUuidGet, index, configGet);
  index++;
  translations.set(key, value.trim());

  if (isTemplateLiteral) {
    const newExpression = t.callExpression(
      t.identifier(configGet.scriptI18nCall),
      [t.stringLiteral(key)],
    );

    const templateLiteral = path.parentPath;
    const elementStart = path.node.start;

    const existingExpressions = templateLiteral.node.expressions.map((exp) => ({
      node: exp,
      start: exp.start,
    }));
    const existingQuasis = templateLiteral.node.quasis.map((quasi) => ({
      node: quasi,
      start: quasi.start,
    }));

    existingExpressions.push({ node: newExpression, start: elementStart });

    templateLiteral.node.expressions = existingExpressions
      .sort((a, b) => a.start - b.start)
      .map((item) => item.node);
    templateLiteral.node.quasis = existingQuasis
      .sort((a, b) => a.start - b.start)
      .map((item) => item.node);

    path.node.value.raw = path.node.value.cooked = '';

    const expressionsLength = templateLiteral.node.expressions.length;
    const quasisLength = templateLiteral.node.quasis.length;

    if (quasisLength <= expressionsLength) {
      const missingQuasisCount = expressionsLength - quasisLength + 1;
      for (let i = 0; i < missingQuasisCount; i++) {
        templateLiteral.node.quasis.push(
          t.templateElement({ raw: '', cooked: '' }, true),
        );
      }
    }
  } else {
    path.replaceWith(
      t.callExpression(t.identifier(configGet.scriptI18nCall), [
        t.stringLiteral(key),
      ]),
    );
  }

  return index;
}

function handleStringWithHTML(path, translations, index) {
  const value = path.node.value;
  const dom = new JSDOM(`<div id="root">${value}</div>`);
  const document = dom.window.document;
  const root = document.getElementById('root');

  function processNode(node) {
    if (node.nodeType === node.TEXT_NODE) {
      if (/[\u4e00-\u9fa5]/.test(node.textContent)) {
        const key = generateUUIDFn(filePathGet, fileUuidGet, index, configGet);
        index++;
        translations.set(key, node.textContent.trim());
        const placeholder = document.createTextNode(
          `{${configGet.scriptI18nCall}('${key}')}`,
        );
        node.parentNode.replaceChild(placeholder, node);
      }
    } else if (node.nodeType === node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }

  processNode(root);

  const translatedValue = root.innerHTML;
  const parts = translatedValue.split(/({[^}]+})/);
  const quasis = [];
  const expressions = [];

  parts.forEach((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const expressionContent = part.slice(1, -1);
      expressions.push(
        t.callExpression(t.identifier(configGet.scriptI18nCall), [
          t.stringLiteral(expressionContent.match(/'([^']+)'/)[1]),
        ]),
      );

      if (index === 0) {
        quasis.push(t.templateElement({ raw: '', cooked: '' }));
      }
      if (index === parts.length - 1) {
        quasis.push(t.templateElement({ raw: '', cooked: '' }, true));
      } else {
        quasis.push(t.templateElement({ raw: '', cooked: '' }));
      }
    } else {
      if (quasis.length === expressions.length) {
        quasis.push(t.templateElement({ raw: part, cooked: part }));
      } else {
        quasis[quasis.length - 1] = t.templateElement(
          { raw: part, cooked: part },
          index === parts.length - 1,
        );
      }
    }
  });

  try {
    const templateLiteral = t.templateLiteral(quasis, expressions);
    path.replaceWith(templateLiteral);
  } catch (e) {
    console.error('Error in AST manipulation:', e);
    console.error('Stack trace:', e.stack);
  }

  return index;
}

function traverseAst(ast, translations) {
  let index = 0;
  let hasPluginImport = false;

  traverse(ast, {
    Program(path) {
      hasPluginImport = path.node.body.some(
        (node) =>
          node.type === 'ImportDeclaration' &&
          node.source.value.includes('i18n'),
      );
    },
    TemplateElement(path) {
      index = handleChineseString(path, translations, index, true);
    },
    StringLiteral(path) {
      const value = path.node.value;
      if (/[\u4e00-\u9fa5]/.test(value)) {
        if (/<[a-z][\s\S]*>/i.test(value)) {
          index = handleStringWithHTML(path, translations, index);
        } else {
          index = handleChineseString(path, translations, index);
        }
      }
    },
  });

  if (index && !hasPluginImport) {
    customLog('i18n插件未安装，自动安装中...');
    ast.program.body.unshift({
      type: 'EmptyStatement',
    });
    ast.program.body.unshift(
      parser.parse(configGet.autoImportI18n, { sourceType: 'module' }).program
        .body[0],
    );
  }

  return index;
}

function generateCode(ast, content) {
  const opts = {
    retainLines: true,
    jsonCompatibleStrings: true,
  };
  return generate(ast, opts, content).code;
}

exports.handlerJsFile = (filePath, fileUuid, config, generateUUID) => {
  filePathGet = filePath;
  fileUuidGet = fileUuid;
  configGet = config;
  generateUUIDFn = generateUUID;

  const content = fs.readFileSync(filePath, 'utf-8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  if (!ast) {
    console.log(`文件 ${filePath} 没有脚本部分，跳过处理。`);
    return;
  }

  const translations = new Map();
  const isChanged = traverseAst(ast, translations);

  return isChanged
    ? { translations, code: generateCode(ast, content), isChanged: true }
    : { code: null, isChanged: false };
};
