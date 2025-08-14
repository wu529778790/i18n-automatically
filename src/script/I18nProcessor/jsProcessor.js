// 直接使用打包内置的 @babel/traverse，避免外部版本不一致
/** @type {any} */
const traverseModule = require('@babel/traverse');

function resolveTraverse(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.traverse === 'function') return mod.traverse;
  if (mod.default && typeof mod.default.traverse === 'function') {
    return mod.default.traverse;
  }
  return null;
}

function resolveTraverseDeep(mod) {
  // 尝试沿着 default 链逐层解析
  let current = mod;
  for (let i = 0; i < 6 && current; i++) {
    const direct = resolveTraverse(current);
    if (typeof direct === 'function') return direct;
    current = current && current.default;
  }
  // 回退：在对象属性中寻找函数或带 traverse 的对象
  if (mod && typeof mod === 'object') {
    for (const key of Object.keys(mod)) {
      const value = mod[key];
      if (typeof value === 'function') return value;
      if (value && typeof value.traverse === 'function') return value.traverse;
      if (value && typeof value.default === 'function') return value.default;
    }
  }
  return null;
}

let traverse /** @type {any} */ = null;
function getTraverse() {
  if (typeof traverse === 'function') return traverse;
  const candidate =
    resolveTraverse(traverseModule) ||
    resolveTraverse(traverseModule && traverseModule.default) ||
    resolveTraverse(traverseModule && traverseModule.traverse) ||
    resolveTraverseDeep(traverseModule);
  if (typeof candidate === 'function') {
    traverse = candidate;
    return traverse;
  }
  // 打印一次详细形态，便于定位打包后导出结构
  try {
    const keys =
      traverseModule && typeof traverseModule === 'object'
        ? Object.keys(traverseModule)
        : [];
    console.warn(
      '[i18n-automatically] 未能解析到 @babel/traverse 函数导出。类型:',
      typeof traverseModule,
      'keys:',
      keys.slice(0, 20).join(','),
    );
  } catch (e) {
    console.error(e);
  }
  return null;
}
const parser = require('@babel/parser');
/** @type {any} */
const typesModule = require('@babel/types');
const t = typesModule.default || typesModule;
const {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} = require('./common');

/**
 * 将配置中的调用名（如 "this.$t"、"i18n.global.t"、"t"）转为 Babel 可用的 callee AST
 * @param {string} calleeStr
 */
function buildCalleeFromString(calleeStr) {
  try {
    if (!calleeStr || typeof calleeStr !== 'string') return t.identifier('t');
    const parts = calleeStr.split('.').filter(Boolean);
    if (parts.length === 0) return t.identifier('t');

    let current;
    if (parts[0] === 'this') {
      current = t.thisExpression();
      parts.shift();
    } else {
      current = t.identifier(parts.shift());
    }
    for (const seg of parts) {
      current = t.memberExpression(current, t.identifier(seg));
    }
    return current;
  } catch (_) {
    return t.identifier('t');
  }
}

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
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      // 支持常见前端语法：React/TS/装饰器、导出提案、动态导入/顶层await/类特性等
      plugins: [
        'jsx',
        ['typescript', { dts: true }],
        'decorators-legacy',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'importMeta',
        'topLevelAwait',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
      ],
    });

    if (!ast) {
      return context;
    }

    // 解决 TS/JS 类型检查在不同 @babel/types 版本下的声明不一致报错
    // 运行时无影响，仅为通过 checkJs
    const traverseFn = getTraverse();
    if (!traverseFn) {
      console.warn(
        '@babel/traverse 解析失败，跳过 AST 遍历。请检查打包形态下的导出。',
      );
      return context;
    }

    // 防御：在某些 Babel 版本组合下，path.hub 可能缺失，补一个最小 hub，避免某些内部逻辑读取 buildError 报错
    function ensurePathHub(path) {
      try {
        if (path && !path.hub) {
          path.hub = {
            file: { opts: { filename: context.filePath || 'unknown' } },
            buildError(node, msg) {
              const e = new Error(msg || 'buildError');
              // 避免 TS/JS 类型检查报错：不要直接赋值未知属性，改用 Object.assign
              Object.assign(e, { node });
              return e;
            },
          };
        }
      } catch (_) {
        // 忽略
      }
    }

    // 包一层 visitor 安全执行，避免 Babel 在构建 CodeFrame 时因 hub 为空二次报错，
    // 同时输出更有用的上下文（文件、节点类型、位置、片段）。
    function runSafely(visitorName, path, runner) {
      try {
        ensurePathHub(path);
        runner();
      } catch (err) {
        try {
          const node = path && path.node ? path.node : {};
          const start = typeof node.start === 'number' ? node.start : 0;
          const end = typeof node.end === 'number' ? node.end : start + 1;
          const snippet = (customContent || context.contentSource).slice(
            Math.max(0, start - 60),
            Math.min((customContent || context.contentSource).length, end + 60),
          );
          console.error(
            `[i18n-automatically] Visitor ${visitorName} 执行失败\n` +
              `file: ${context.filePath}\n` +
              `nodeType: ${node.type || 'unknown'} range: [${start}, ${end}]\n` +
              `snippet: ${snippet}\n` +
              `error: ${err && err.stack ? err.stack : err && err.message}`,
          );
        } catch (logErr) {
          console.error('[i18n-automatically] 记录 visitor 错误失败', logErr);
        }
      }
    }

    try {
      traverseFn(/** @type {any} */ (ast), {
        noScope: true,
        Program: (path) =>
          runSafely('Program', path, () => checkForI18nImport(path, context)),
        TemplateElement: (path) =>
          runSafely('TemplateElement', path, () =>
            handleChineseString(path, context, true),
          ),
        StringLiteral: (path) =>
          runSafely('StringLiteral', path, () =>
            handleChineseString(path, context),
          ),
        JSXText: (path) =>
          runSafely('JSXText', path, () => handleChineseString(path, context)),
        JSXAttribute: (path) =>
          runSafely('JSXAttribute', path, () =>
            handleJSXAttribute(path, context),
          ),
        JSXExpressionContainer: (path) =>
          runSafely('JSXExpressionContainer', path, () =>
            handleJSXExpressionContainer(path, context),
          ),
      });
    } catch (traverseError) {
      console.warn(
        '@babel/traverse 遍历出错，可能是 babel 版本兼容性问题:',
        traverseError && traverseError.stack
          ? traverseError.stack
          : traverseError && traverseError.message,
      );
      // 即使遍历失败，也尝试生成代码
    }

    if (
      context.index > (context.templateSize ? context.templateSize : 0) &&
      !context.hasPluginImport &&
      context.config.autoImportI18n
    ) {
      addI18nImport(ast, context);
    }

    context.ast = ast;
    if (context.index > 0) {
      // 对于 Vue 的 script 处理，customContent 存在时仅生成脚本片段，避免把整个 .vue 内容误参与生成导致重复包裹
      const originalCode = customContent || context.contentSource;
      context.contentChanged = generateCode(ast, originalCode).replace(
        /(?<=\?.)\n/g,
        '',
      );
    }
  } catch (error) {
    console.error('processJsAst 中出错:', error);
  } finally {
    return context;
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
      node.type === 'ImportDeclaration' &&
      node.source.value.trim() === context.config.i18nImportPath,
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

    // 当 excludeDebugContexts !== false 时（默认开启），跳过调试上下文(console/throw/assert/debugger)中的中文
    const skipDebugContexts =
      !('excludeDebugContexts' in (context.config || {})) ||
      context.config.excludeDebugContexts !== false;
    if (
      !containsChinese(value) ||
      (skipDebugContexts && isInDebugContext(path))
    )
      return;

    if (stringWithDom(value)) {
      handleStringWithDom(path, context, isTemplateLiteral);
      return;
    }

    const key = generateKey(context);

    if (isTemplateLiteral) {
      handleTemplateLiteral(path, context, key);
    } else if (
      path.type === 'JSXText' ||
      (path.parent && path.parent.type.includes('JSX'))
    ) {
      replaceWithJSXI18nCall(path, context, key);
    } else {
      replaceWithI18nCall(path, context, key);
    }
    context.translations.set(key, value.trim());
  } catch (error) {
    context.index--;
    console.error('handleChineseString 中出错:', error);
  }
}
/**
 * 处理包含 DOM 的字符串。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 * @param {boolean} isTemplateLiteral - 是否为模板字面量。
 */
function handleStringWithDom(path, context, isTemplateLiteral) {
  if (path.type === 'StringLiteral') {
    convertStringLiteralToTemplateLiteral(path, context);
  } else if (isTemplateLiteral) {
    processTemplateElement(path, context);
  }
}

/**
 * 用 JSX 中的 i18n 调用替换当前路径。
 * @param {Object} path - AST 路径对象。
 * @param {Object} context - 处理上下文。
 * @param {string} key - 翻译键。
 */
function replaceWithJSXI18nCall(path, context, key) {
  path.replaceWith(
    t.jsxExpressionContainer(
      t.callExpression(buildCalleeFromString(context.config.scriptI18nCall), [
        t.stringLiteral(key),
      ]),
    ),
  );
}

/**
 * 将字符串字面量转换为模板字面量
 *
 * @param {Object} path - Babel 的路径对象，表示当前遍历到的 AST 节点
 * @param {Object} context - 上下文对象，包含处理过程中需要的信息
 *
 * @description
 * 这个函数接收一个字符串字面量的 AST 节点，将其转换为等价的模板字面量。
 * 主要用于处理包含国际化函数调用的复杂字符串。
 *
 * 处理步骤：
 * 1. 使用 handlerDomNode 函数处理原始字符串
 * 2. 将处理后的字符串分割为静态部分和表达式部分
 * 3. 创建相应的 quasis（静态部分）和 expressions（表达式部分）
 * 4. 使用这些 quasis 和 expressions 创建一个新的模板字面量
 * 5. 将原始的字符串字面量替换为新创建的模板字面量
 *
 * @throws {Error} 如果在转换过程中发生错误，将在控制台输出错误信息
 */
function convertStringLiteralToTemplateLiteral(path, context) {
  try {
    const stringLiteral = path.node;
    // 处理原始字符串，可能包含 DOM 节点和国际化函数调用
    const translatedString = handlerDomNode(stringLiteral.value, context);

    // 将字符串分割为静态部分和表达式部分
    const parts = translatedString.split(/(\$\{[^}]+\})/);

    const quasis = [];
    const expressions = [];

    parts.forEach((part, index) => {
      if (part.startsWith('${') && part.endsWith('}')) {
        // 处理表达式部分
        const exp = part.slice(2, -1); // 移除 ${ 和 }
        expressions.push(t.identifier(exp)); // 假设它是一个简单的标识符

        // 在表达式之前添加一个空的 quasi，除非它是第一个部分
        if (index === 0) {
          quasis.push(t.templateElement({ raw: '', cooked: '' }));
        }
      } else {
        // 处理静态字符串部分
        quasis.push(
          t.templateElement(
            { raw: part, cooked: part },
            index === parts.length - 1, // 对最后一个元素为 true
          ),
        );
      }
    });

    // 使用 quasis 和 expressions 创建模板字面量
    const templateLiteral = t.templateLiteral(quasis, expressions);

    // 从原始的字符串字面量复制位置信息
    templateLiteral.start = stringLiteral.start;
    templateLiteral.end = stringLiteral.end;
    templateLiteral.loc = stringLiteral.loc;

    // 用新的模板字面量替换原始的字符串字面量
    path.replaceWith(templateLiteral);
  } catch (error) {
    console.error(
      'convertStringLiteralToTemplateLiteral 函数中发生错误:',
      error,
    );
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
  // 检查当前节点是否是TSLiteralType，如果是则跳过替换
  // if (path.parentPath.isTSLiteralType()) {
  //   return;
  // }

  // 执行替换为i18n函数调用
  path.replaceWith(
    t.callExpression(buildCalleeFromString(context.config.scriptI18nCall), [
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
    buildCalleeFromString(context.config.scriptI18nCall),
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
  if (!containsChinese(str)) {
    return str; // Early return if no Chinese characters
  }

  const splitArray = splitStringWithTags(str);
  let result = '';
  let hasChanges = false;

  for (const item of splitArray) {
    if (item.startsWith('<') && item.endsWith('>')) {
      // HTML tag
      result += item;
    } else {
      // Text content (may include Chinese and/or JavaScript expressions)
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
  let result = '';
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // JavaScript expression
      result += match[1];
    } else if (match[2] && containsChinese(match[2])) {
      // Chinese text
      const key = generateKey(context);
      context.translations.set(key, match[2].trim());
      result += `\${${context.config.scriptI18nCall}('${key}')}`;
    } else {
      // Other text
      result += match[2] || '';
    }
  }

  return result;
}

// Existing splitStringWithTags function
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
  handleChineseString,
  handleStringWithDom,
  replaceWithJSXI18nCall,
  convertStringLiteralToTemplateLiteral,
  handleJSXAttribute,
  handleJSXExpressionContainer,
  isInDebugContext,
  replaceWithI18nCall,
  handleTemplateLiteral,
  processTemplateElement,
  processTextContent,
  splitStringWithTags,
  addI18nImport,
};
