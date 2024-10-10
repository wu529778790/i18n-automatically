const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const t = require('@babel/types');
const { JSDOM } = require('jsdom');
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  logger,
} = require('./common');

/**
 * 处理 JavaScript AST
 * @param {object} context 处理上下文
 * @param {string} customContent 自定义内容
 * @returns {object} 处理后的context
 */
function processJsAst(context, customContent) {
  try {
    context.hasPluginImport = false;
    const ast = parser.parse(customContent || context.contentSource, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    if (!ast) {
      logger.warn(`文件 ${context.filePath} 没有脚本部分，跳过处理。`);
      return context;
    }

    traverse(ast, {
      Program: (path) => checkForI18nImport(path, context),
      TemplateElement: (path) => handleChineseString(path, context, true),
      StringLiteral: (path) => handleStringLiteral(path, context),
    });

    if (
      context.index > 0 &&
      !context.hasPluginImport &&
      context.config.enableI18n
    ) {
      addI18nImport(ast, context);
    }

    context.ast = ast;
    if (context.index > 0) {
      context.contentChanged = generateCode(ast, context.contentSource);
    }
    return context;
  } catch (error) {
    logger.error('Error in processJsAst:', error);
    throw error;
  }
}

/**
 * 检查是否已经导入了 i18n 插件
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 */
function checkForI18nImport(path, context) {
  context.hasPluginImport = path.node.body.some(
    (node) =>
      node.type === 'ImportDeclaration' && node.source.value.includes('i18n'),
  );
}

/**
 * 处理字符串字面量
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 */
function handleStringLiteral(path, context) {
  try {
    if (
      containsChinese(path.node.value) &&
      path?.parent?.type !== 'ImportDeclaration'
    ) {
      if (/<[a-z][\s\S]*>/i.test(path.node.value)) {
        handleStringWithHTML(path, context);
      } else {
        handleChineseString(path, context);
      }
    }
  } catch (error) {
    logger.error('Error in handleStringLiteral:', error);
  }
}

/**
 * 处理中文字符串
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 * @param {boolean} isTemplateLiteral 是否为模板字符串
 * @returns {boolean} 是否处理成功
 */
function handleChineseString(path, context, isTemplateLiteral = false) {
  try {
    const value = isTemplateLiteral ? path.node.value.raw : path.node.value;

    if (!containsChinese(value)) return false;

    if (isInConsoleCall(path)) return false;

    const key = generateKey(context);
    context.translations.set(key, value.trim());

    if (isTemplateLiteral) {
      handleTemplateLiteral(path, context, key);
    } else {
      replaceWithI18nCall(path, context, key);
    }
    return true;
  } catch (error) {
    logger.error('Error in handleChineseString:', error);
    return false;
  }
}

/**
 * 检查节点是否在 console 调用中
 * @param {object} path Babel 路径对象
 * @returns {boolean} 是否在 console 调用中
 */
function isInConsoleCall(path) {
  return path.findParent(
    (p) =>
      p.isCallExpression() &&
      p.get('callee').isMemberExpression() &&
      p.get('callee.object').isIdentifier({ name: 'console' }),
  );
}

/**
 * 替换为 i18n 调用
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 * @param {string} key 翻译键
 */
function replaceWithI18nCall(path, context, key) {
  path.replaceWith(
    t.callExpression(t.identifier(context.config.scriptI18nCall), [
      t.stringLiteral(key),
    ]),
  );
}

/**
 * 处理模板字符串
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 * @param {string} key 翻译键
 */
function handleTemplateLiteral(path, context, key) {
  const newExpression = t.callExpression(
    t.identifier(context.config.scriptI18nCall),
    [t.stringLiteral(key)],
  );

  const templateLiteral = path.parentPath;
  const elementStart = path.node.start;

  newExpression.start = elementStart;

  const existingExpressions = templateLiteral.node.expressions.map((exp) => ({
    node: exp,
    start: exp.start,
  }));
  const existingQuasis = templateLiteral.node.quasis.map((quasi) => ({
    node: quasi,
    start: quasi.start,
  }));

  existingExpressions.push({ node: newExpression, start: elementStart });

  const sortedExpressions = existingExpressions
    .sort((a, b) => a.start - b.start)
    .map((item) => item.node);
  const sortedQuasis = existingQuasis
    .sort((a, b) => a.start - b.start)
    .map((item) => item.node);

  adjustQuasisAndExpressions(sortedQuasis, sortedExpressions);

  templateLiteral.node.expressions = sortedExpressions;
  templateLiteral.node.quasis = sortedQuasis;

  path.node.value.raw = path.node.value.cooked = '';
}

/**
 * 调整 quasis 和 expressions
 * @param {Array} sortedQuasis 排序后的 quasis
 * @param {Array} sortedExpressions 排序后的 expressions
 */
function adjustQuasisAndExpressions(sortedQuasis, sortedExpressions) {
  while (sortedQuasis.length < sortedExpressions.length + 1) {
    const isTail = sortedQuasis.length === sortedExpressions.length;
    const newQuasiStart = isTail
      ? sortedExpressions[sortedExpressions.length - 1].start + 1
      : sortedExpressions[sortedQuasis.length - 1].start + 1;
    sortedQuasis.push(createQuasi(newQuasiStart, isTail));
  }

  while (sortedQuasis.length > sortedExpressions.length + 1) {
    sortedQuasis.pop();
  }

  sortedQuasis[sortedQuasis.length - 1].tail = true;
  sortedQuasis.sort((a, b) => a.start - b.start);
}
/**
 * 创建新的 quasi 元素
 * @param {number} start 起始位置
 * @param {boolean} tail 是否为尾部元素
 * @returns {object} 新的 quasi 元素
 */
function createQuasi(start, tail = false) {
  const quasi = t.templateElement({ raw: '', cooked: '' }, tail);
  quasi.start = start;
  return quasi;
}
/**
 * 处理包含 HTML 的字符串
 * @param {object} path Babel 路径对象
 * @param {object} context 处理上下文
 * @returns {boolean} 是否发生更改
 */
function handleStringWithHTML(path, context) {
  const value = path.node.value;
  if (!containsChinese(value)) {
    return false;
  }

  const dom = new JSDOM(`<div id="root">${value}</div>`);
  const document = dom.window.document;
  const root = document.getElementById('root');

  let isChanged = false;

  function processNode(node) {
    if (node.nodeType === node.TEXT_NODE) {
      if (containsChinese(node.textContent)) {
        const key = generateKey(context);
        context.translations.set(key, node.textContent.trim());
        const placeholder = document.createTextNode(
          `{${context.config.scriptI18nCall}('${key}')}`,
        );
        node.parentNode.replaceChild(placeholder, node);
        isChanged = true;
      }
    } else if (node.nodeType === node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }

  processNode(root);

  if (!isChanged) {
    return false;
  }

  const translatedValue = root.innerHTML;
  const parts = translatedValue.split(/({[^}]+})/);
  const { quasis, expressions } = createQuasisAndExpressions(parts, context);

  try {
    const templateLiteral = t.templateLiteral(quasis, expressions);
    path.replaceWith(templateLiteral);
    return true;
  } catch (e) {
    console.error('Error in AST manipulation:', e);
    console.error('Stack trace:', e.stack);
    return false;
  }
}

/**
 * 创建 quasis 和 expressions
 * @param {string[]} parts 分割后的字符串部分
 * @param {object} context 处理上下文
 * @returns {object} 包含 quasis 和 expressions 的对象
 */
function createQuasisAndExpressions(parts, context) {
  const quasis = [];
  const expressions = [];

  parts.forEach((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      const expressionContent = part.slice(1, -1);
      expressions.push(
        t.callExpression(t.identifier(context.config.scriptI18nCall), [
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

  return { quasis, expressions };
}

/**
 * 添加 i18n 导入
 * @param {object} ast AST 对象
 * @param {object} context 处理上下文
 */
function addI18nImport(ast, context) {
  logger.info('i18n插件未安装，自动安装中...');
  ast.program.body.unshift(
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('i18n'))],
      t.stringLiteral(context.config.i18nImportPath),
    ),
  );
}

const handleJsFile = createI18nProcessor(processJsAst);

module.exports = {
  handleChineseString,
  handleStringWithHTML,
  processJsAst,
  handleJsFile,
};
