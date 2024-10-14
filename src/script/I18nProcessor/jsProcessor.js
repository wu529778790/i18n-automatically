const traverse = require('@babel/traverse').default;
const parser = require('@babel/parser');
const t = require('@babel/types');
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  logger,
  stringWithDom,
} = require('./common');

/**
 * 处理 JavaScript AST 以进行国际化。
 * @param {Object} context - 处理上下文。
 * @param {string} [customContent] - 要处理的自定义内容，如果不提供则使用 context.contentSource。
 * @returns {Object} 处理后更新的上下文。
 * @throws {Error} 如果在 AST 处理过程中出现错误。
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
      StringLiteral: (path) => handleChineseString(path, context),
      JSXText: (path) => handleChineseString(path, context),
      JSXAttribute: (path) => handleJSXAttribute(path, context),
      JSXExpressionContainer: (path) =>
        handleJSXExpressionContainer(path, context),
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
      context.contentChanged = generateCode(ast, context.contentSource).replace(
        /(?<=\?.)\n/g,
        '',
      );
    }
    return context;
  } catch (error) {
    logger.error('processJsAst 中出错:', error);
    throw error;
  }
}

/**
 * 检查 AST 中是否存在 i18n 导入。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 */
function checkForI18nImport(path, context) {
  context.hasPluginImport = path.node.body.some(
    (node) =>
      node.type === 'ImportDeclaration' && node.source.value.includes('i18n'),
  );
}

/**
 * 处理 AST 中的中文字符串。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 * @param {boolean} [isTemplateLiteral=false] - 是否为模板字面量。
 */
function handleChineseString(path, context, isTemplateLiteral = false) {
  try {
    const value = isTemplateLiteral ? path.node.value.raw : path.node.value;

    if (!containsChinese(value) || isInDebugContext(path)) return;

    if (stringWithDom(value) && path.type === 'TemplateElement') {
      processTemplateElement(path, context);
      return;
    }

    const key = generateKey(context);
    context.translations.set(key, value.trim());

    if (isTemplateLiteral) {
      handleTemplateLiteral(path, context, key);
    } else if (
      path.type === 'JSXText' ||
      (path.parent && path.parent.type.includes('JSX'))
    ) {
      path.replaceWith(
        t.jsxExpressionContainer(
          t.callExpression(t.identifier(context.config.scriptI18nCall), [
            t.stringLiteral(key),
          ]),
        ),
      );
    } else {
      replaceWithI18nCall(path, context, key);
    }
  } catch (error) {
    logger.error('handleChineseString 中出错:', error);
  }
}

/**
 * 处理 AST 中的 JSX 属性。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 */
function handleJSXAttribute(path, context) {
  if (path.node.value && t.isStringLiteral(path.node.value)) {
    handleChineseString(path.get('value'), context);
  }
}

/**
 * 处理 AST 中的 JSX 表达式容器。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 */
function handleJSXExpressionContainer(path, context) {
  if (t.isStringLiteral(path.node.expression)) {
    handleChineseString(path.get('expression'), context);
  }
}

/**
 * 检查当前路径是否在调试上下文中。
 * @param {Object} path - AST 路径对象。
 * @returns {boolean} 如果在调试上下文中返回 true，否则返回 false。
 */
function isInDebugContext(path) {
  const debugContexts = [
    (p) =>
      p.isCallExpression() &&
      p.get('callee').isMemberExpression() &&
      p.get('callee.object').isIdentifier({ name: 'console' }),
    (p) =>
      (p.isNewExpression() &&
        p.get('callee').isIdentifier({ name: 'Error' })) ||
      p.isThrowStatement(),
    (p) =>
      p.isCallExpression() &&
      (p.get('callee').isIdentifier({ name: 'assert' }) ||
        (p.get('callee').isMemberExpression() &&
          p.get('callee.object').isIdentifier({ name: 'assert' }))),
    (p) => p.isDebuggerStatement(),
  ];

  return debugContexts.some((context) => path.findParent(context) !== null);
}

/**
 * 用 i18n 调用替换当前路径。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 * @param {string} key - 翻译键。
 */
function replaceWithI18nCall(path, context, key) {
  path.replaceWith(
    t.callExpression(t.identifier(context.config.scriptI18nCall), [
      t.stringLiteral(key),
    ]),
  );
}

/**
 * 处理 AST 中的模板字面量。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 * @param {string} key - 翻译键。
 */
function handleTemplateLiteral(path, context, key) {
  const newExpression = t.callExpression(
    t.identifier(context.config.scriptI18nCall),
    [t.stringLiteral(key)],
  );

  const templateLiteral = path.parentPath;
  newExpression.start = path.node.start;

  const existingExpressions = templateLiteral.node.expressions.map((exp) => ({
    node: exp,
    start: exp.start,
  }));
  const existingQuasis = templateLiteral.node.quasis.map((quasi) => ({
    node: quasi,
    start: quasi.start,
  }));

  existingExpressions.push({ node: newExpression, start: path.node.start });

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
 * 调整模板字面量的 quasis 和 expressions。
 * @param {Array} sortedQuasis - 排序后的 quasis 数组。
 * @param {Array} sortedExpressions - 排序后的 expressions 数组。
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
 * 创建新的 quasi 元素。
 * @param {number} start - quasi 的起始位置。
 * @param {boolean} [tail=false] - 是否为尾部 quasi。
 * @returns {Object} 创建的 quasi 元素。
 */
function createQuasi(start, tail = false) {
  const quasi = t.templateElement({ raw: '', cooked: '' }, tail);
  quasi.start = start;
  return quasi;
}

/**
 * 处理 AST 中的模板元素。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 */
function processTemplateElement(path, context) {
  const value = path.node.value.raw || path.node.value;
  const translatedString = handlerDomNode(value, context);
  path.node.value = { raw: translatedString, cooked: translatedString };
}

/**
 * 处理字符串中的 DOM 节点。
 * @param {string} str - 包含 DOM 节点的输入字符串。
 * @param {Object} context - 处理上下文。
 * @returns {string} 处理后带有翻译的字符串。
 */
function handlerDomNode(str, context) {
  const splitArray = splitStringWithTags(str);
  const translatedArray = splitArray.map((item) => {
    if (item.startsWith('<') && item.endsWith('>')) {
      return item;
    } else {
      const key = generateKey(context);
      context.translations.set(key, item.trim());
      return `\${${context.config.scriptI18nCall}('${key}')}`;
    }
  });
  return translatedArray.join('');
}

/**
 * 将字符串分割为标签和文本内容的数组。
 * @param {string} str - 要分割的输入字符串。
 * @returns {Array} 标签和文本内容的数组。
 */
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

/**
 * 向 AST 添加 i18n 导入。
 * @param {Object} ast - AST 对象。
 * @param {Object} context - 处理上下文。
 */
function addI18nImport(ast, context) {
  logger.info('i18n 插件未安装，正在自动安装...');
  ast.program.body.unshift(
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('i18n'))],
      t.stringLiteral(context.config.i18nImportPath),
    ),
  );
}

const handleJsFile = createI18nProcessor(processJsAst);

module.exports = {
  processJsAst,
  handleJsFile,
  handlerDomNode,
};
