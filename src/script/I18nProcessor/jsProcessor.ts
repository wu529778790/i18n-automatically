// 直接使用打包内置的 @babel/traverse，避免外部版本不一致
const traverseModule: any = require('@babel/traverse');

function resolveTraverse(mod: any): any {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.traverse === 'function') return mod.traverse;
  if (mod.default && typeof mod.default.traverse === 'function') {
    return mod.default.traverse;
  }
  return null;
}

function resolveTraverseDeep(mod: any): any {
  // 尝试沿着 default 链逐层解析
  let current: any = mod;
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

let traverse: any = null;
function getTraverse(): any {
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
  } catch (e: any) {
    console.error(e);
  }
  return null;
}
import * as parser from '@babel/parser';
import * as typesModule from '@babel/types';
const t: any = typesModule.default || typesModule;
import {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} from './common';
import type { ProcessorContext } from '../../../types';

/**
 * 将配置中的调用名（如 "this.$t"、"i18n.global.t"、"t"）转为 Babel 可用的 callee AST
 */
function buildCalleeFromString(calleeStr: string): any {
  try {
    if (!calleeStr || typeof calleeStr !== 'string') return t.identifier('t');
    const parts = calleeStr.split('.').filter(Boolean);
    if (parts.length === 0) return t.identifier('t');

    let current: any;
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
  } catch (_: any) {
    return t.identifier('t');
  }
}

/**
 * 处理 JavaScript AST 以进行国际化。
 */
function processJsAst(
  context: ProcessorContext,
  customContent?: string,
): ProcessorContext {
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
    function ensurePathHub(path: any) {
      try {
        if (path && !path.hub) {
          path.hub = {
            file: { opts: { filename: context.filePath || 'unknown' } },
            buildError(node: any, msg: string) {
              const e = new Error(msg || 'buildError');
              // 避免 TS/JS 类型检查报错：不要直接赋值未知属性，改用 Object.assign
              Object.assign(e, { node });
              return e;
            },
          };
        }
      } catch (_: any) {
        // 忽略
      }
    }

    // 包一层 visitor 安全执行，避免 Babel 在构建 CodeFrame 时因 hub 为空二次报错，
    // 同时输出更有用的上下文（文件、节点类型、位置、片段）。
    function runSafely(visitorName: string, path: any, runner: () => void) {
      try {
        ensurePathHub(path);
        runner();
      } catch (err: any) {
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
        } catch (logErr: any) {
          console.error('[i18n-automatically] 记录 visitor 错误失败', logErr);
        }
      }
    }

    try {
      traverseFn(ast, {
        noScope: true,
        Program: (path: any) =>
          runSafely('Program', path, () => checkForI18nImport(path, context)),
        TemplateElement: (path: any) =>
          runSafely('TemplateElement', path, () =>
            handleChineseString(path, context, true),
          ),
        StringLiteral: (path: any) =>
          runSafely('StringLiteral', path, () =>
            handleChineseString(path, context),
          ),
        JSXText: (path: any) =>
          runSafely('JSXText', path, () => handleChineseString(path, context)),
        JSXAttribute: (path: any) =>
          runSafely('JSXAttribute', path, () =>
            handleJSXAttribute(path, context),
          ),
        JSXExpressionContainer: (path: any) =>
          runSafely('JSXExpressionContainer', path, () =>
            handleJSXExpressionContainer(path, context),
          ),
      });
    } catch (traverseError: any) {
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
  } catch (error: any) {
    console.error('processJsAst 中出错:', error);
  } finally {
    return context;
  }
}

/**
 * 检查 AST 中是否存在 i18n 导入。
 */
function checkForI18nImport(path: any, context: ProcessorContext): void {
  context.hasPluginImport = path.node.body.some(
    (node: any) =>
      node.type === 'ImportDeclaration' &&
      node.source.value.trim() === context.config.i18nImportPath,
  );
}

/**
 * 处理 AST 中的中文字符串。
 */
function handleChineseString(
  path: any,
  context: ProcessorContext,
  isTemplateLiteral: boolean = false,
): void {
  try {
    const value: string = isTemplateLiteral ? path.node.value.raw : path.node.value;

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

    const key = generateKey(context, value);

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
  } catch (error: any) {
    context.index--;
    console.error('handleChineseString 中出错:', error);
  }
}
/**
 * 处理包含 DOM 的字符串。
 */
function handleStringWithDom(
  path: any,
  context: ProcessorContext,
  isTemplateLiteral: boolean,
): void {
  if (path.type === 'StringLiteral') {
    convertStringLiteralToTemplateLiteral(path, context);
  } else if (isTemplateLiteral) {
    processTemplateElement(path, context);
  }
}

/**
 * 用 JSX 中的 i18n 调用替换当前路径。
 */
function replaceWithJSXI18nCall(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
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
function convertStringLiteralToTemplateLiteral(
  path: any,
  context: ProcessorContext,
): void {
  try {
    const stringLiteral = path.node;
    // 处理原始字符串，可能包含 DOM 节点和国际化函数调用
    const translatedString = handlerDomNode(stringLiteral.value, context);

    // 将字符串分割为静态部分和表达式部分
    const parts = translatedString.split(/(\$\{[^}]+\})/);

    const quasis: any[] = [];
    const expressions: any[] = [];

    parts.forEach((part: string, index: number) => {
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
  } catch (error: any) {
    console.error(
      'convertStringLiteralToTemplateLiteral 函数中发生错误:',
      error,
    );
  }
}

/**
 * 处理 AST 中的 JSX 属性。
 */
function handleJSXAttribute(path: any, context: ProcessorContext): void {
  if (path.node.value && t.isStringLiteral(path.node.value)) {
    handleChineseString(path.get('value'), context);
  }
}

/**
 * 处理 AST 中的 JSX 表达式容器。
 */
function handleJSXExpressionContainer(
  path: any,
  context: ProcessorContext,
): void {
  if (t.isStringLiteral(path.node.expression)) {
    handleChineseString(path.get('expression'), context);
  }
}

/**
 * 检查当前路径是否在调试上下文中。
 */
function isInDebugContext(path: any): boolean {
  const debugContexts = [
    (p: any) =>
      p.isCallExpression() &&
      p.get('callee').isMemberExpression() &&
      p.get('callee.object').isIdentifier({ name: 'console' }),
    (p: any) =>
      (p.isNewExpression() &&
        p.get('callee').isIdentifier({ name: 'Error' })) ||
      p.isThrowStatement(),
    (p: any) =>
      p.isCallExpression() &&
      (p.get('callee').isIdentifier({ name: 'assert' }) ||
        (p.get('callee').isMemberExpression() &&
          p.get('callee.object').isIdentifier({ name: 'assert' }))),
    (p: any) => p.isDebuggerStatement(),
  ];

  return debugContexts.some((context) => path.findParent(context) !== null);
}

/**
 * 用 i18n 调用替换当前路径。
 */
function replaceWithI18nCall(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
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
 */
function handleTemplateLiteral(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
  const newExpression = t.callExpression(
    buildCalleeFromString(context.config.scriptI18nCall),
    [t.stringLiteral(key)],
  );

  const templateLiteral = path.parentPath;
  newExpression.start = path.node.start;

  const existingExpressions = templateLiteral.node.expressions.map(
    (exp: any) => ({
      node: exp,
      start: exp.start,
    }),
  );
  const existingQuasis = templateLiteral.node.quasis.map((quasi: any) => ({
    node: quasi,
    start: quasi.start,
  }));

  existingExpressions.push({ node: newExpression, start: path.node.start });

  const sortedExpressions = existingExpressions
    .sort((a: any, b: any) => a.start - b.start)
    .map((item: any) => item.node);
  const sortedQuasis = existingQuasis
    .sort((a: any, b: any) => a.start - b.start)
    .map((item: any) => item.node);

  adjustQuasisAndExpressions(sortedQuasis, sortedExpressions);

  templateLiteral.node.expressions = sortedExpressions;
  templateLiteral.node.quasis = sortedQuasis;

  path.node.value.raw = path.node.value.cooked = '';
}

/**
 * 调整模板字面量的 quasis 和 expressions。
 */
function adjustQuasisAndExpressions(
  sortedQuasis: any[],
  sortedExpressions: any[],
): void {
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
  sortedQuasis.sort((a: any, b: any) => a.start - b.start);
}

/**
 * 创建新的 quasi 元素。
 */
function createQuasi(start: number, tail: boolean = false): any {
  const quasi = t.templateElement({ raw: '', cooked: '' }, tail);
  quasi.start = start;
  return quasi;
}

/**
 * 处理 AST 中的模板元素。
 */
function processTemplateElement(path: any, context: ProcessorContext): void {
  const value = path.node.value.raw || path.node.value;
  const translatedString = handlerDomNode(value, context);
  path.node.value = { raw: translatedString, cooked: translatedString };
}

/**
 * 处理字符串中的 DOM 节点。
 */
function handlerDomNode(str: string, context: ProcessorContext): string {
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

function processTextContent(text: string, context: ProcessorContext): string {
  const regex = /(\${[^}]+})|([^$]+)/g;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // JavaScript expression
      result += match[1];
    } else if (match[2] && containsChinese(match[2])) {
      // Chinese text
      const key = generateKey(context, match[2]);
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
function splitStringWithTags(str: string): string[] {
  const regex = /(<\/?[^>]+>)|([^<]+)/g;
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    if (match[1] || match[2]) {
      result.push(match[1] || match[2]);
    }
  }
  return result;
}

/**
 * 向 AST 添加 i18n 导入。
 */
function addI18nImport(ast: any, context: ProcessorContext): void {
  ast.program.body.unshift(
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('i18n'))],
      t.stringLiteral(context.config.i18nImportPath),
    ),
  );
}

export {
  processJsAst,
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

export const handleJsFile = createI18nProcessor(processJsAst);
