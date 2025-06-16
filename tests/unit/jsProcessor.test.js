const assert = require('assert');
const t = require('@babel/types');
const {
  processJsAst,
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
  handlerDomNode,
  processTextContent,
  splitStringWithTags,
  addI18nImport,
} = require('../src/script/I18nProcessor/jsProcessor.js');

suite('JavaScript处理器核心功能最小化测试套件', () => {
  const createContext = () => ({
    config: { scriptI18nCall: 't', i18nImportPath: '@/i18n' },
    translations: new Map(),
    index: 0,
    filePath: 'test.js',
    fileUuid: '123456',
    contentSource: '',
  });

  test('processJsAst - 基本AST处理', () => {
    const context = createContext();
    context.contentSource = "const message = '你好，世界';";

    const result = processJsAst(context);

    assert.strictEqual(result.translations.size, 1);
    assert.match(
      result.contentChanged,
      /const message = t\('test-123456-1'\);/,
    );
  });

  test('handleChineseString - 处理中文字符串', () => {
    const context = createContext();
    const path = {
      node: { value: '你好，世界' },
      replaceWith: (newNode) => {
        path.node = newNode;
      },
    };

    handleChineseString(path, context);

    assert.strictEqual(context.translations.size, 1);
    assert(t.isCallExpression(path.node));
  });

  test('handleStringWithDom - 处理包含DOM的字符串', () => {
    const context = createContext();
    const path = {
      type: 'StringLiteral',
      node: { value: '你好，<span>世界</span>' },
      replaceWith: (newNode) => {
        path.node = newNode;
      },
    };

    handleStringWithDom(path, context);

    assert(t.isTemplateLiteral(path.node));
  });

  test('replaceWithJSXI18nCall - 替换为JSX中的i18n调用', () => {
    const context = createContext();
    const path = {
      replaceWith: (newNode) => {
        path.node = newNode;
      },
    };

    replaceWithJSXI18nCall(path, context, 'test-key');

    assert(t.isJSXExpressionContainer(path.node));
  });

  test('convertStringLiteralToTemplateLiteral - 转换字符串字面量为模板字面量', () => {
    const context = createContext();
    const path = {
      node: { value: '你好，${name}', start: 0, end: 10, loc: {} },
      replaceWith: (newNode) => {
        path.node = newNode;
      },
    };

    convertStringLiteralToTemplateLiteral(path, context);

    assert(t.isTemplateLiteral(path.node));
  });

  test('handleJSXAttribute - 处理JSX属性', () => {
    const context = createContext();
    const path = {
      node: { value: t.stringLiteral('你好') },
      get: () => ({ node: { value: '你好' } }),
    };

    handleJSXAttribute(path, context);

    assert.strictEqual(context.translations.size, 1);
  });

  test('handleJSXExpressionContainer - 处理JSX表达式容器', () => {
    const context = createContext();
    const path = {
      node: { expression: t.stringLiteral('你好') },
      get: () => ({ node: { value: '你好' } }),
    };

    handleJSXExpressionContainer(path, context);

    assert.strictEqual(context.translations.size, 1);
  });

  test('isInDebugContext - 检查调试上下文', () => {
    const debugPath = {
      findParent: () => ({
        isCallExpression: () => true,
        get: () => ({
          isMemberExpression: () => true,
          isIdentifier: () => true,
        }),
      }),
    };

    const result = isInDebugContext(debugPath);

    assert.strictEqual(result, true);
  });

  test('replaceWithI18nCall - 替换为i18n调用', () => {
    const context = createContext();
    const path = {
      replaceWith: (newNode) => {
        path.node = newNode;
      },
    };

    replaceWithI18nCall(path, context, 'test-key');

    assert(t.isCallExpression(path.node));
  });

  test('handleTemplateLiteral - 处理模板字面量', () => {
    const context = createContext();
    const path = {
      node: { value: { raw: '你好', cooked: '你好' }, start: 0 },
      parentPath: {
        node: {
          expressions: [],
          quasis: [{ value: { raw: '你好', cooked: '你好' }, start: 0 }],
        },
      },
    };

    handleTemplateLiteral(path, context, 'test-key');

    assert.strictEqual(path.parentPath.node.expressions.length, 1);
    assert.strictEqual(path.node.value.raw, '');
  });

  test('processTemplateElement - 处理模板元素', () => {
    const context = createContext();
    const path = {
      node: { value: { raw: '你好，<span>世界</span>' } },
    };

    processTemplateElement(path, context);

    assert.notStrictEqual(path.node.value.raw, '你好，<span>世界</span>');
  });

  test('handlerDomNode - 处理DOM节点', () => {
    const context = createContext();
    const input = '你好，<span>世界</span>';

    const result = handlerDomNode(input, context);

    assert.notStrictEqual(result, input);
    assert.strictEqual(context.translations.size, 2);
  });

  test('processTextContent - 处理文本内容', () => {
    const context = createContext();
    const input = '你好，${name}';

    const result = processTextContent(input, context);

    assert.notStrictEqual(result, input);
    assert.strictEqual(context.translations.size, 1);
  });

  test('splitStringWithTags - 分割带标签的字符串', () => {
    const input = '你好，<span>世界</span>';

    const result = splitStringWithTags(input);

    assert.strictEqual(result.length, 4);
    assert.deepStrictEqual(result, ['你好，', '<span>', '世界', '</span>']);
  });

  test('addI18nImport - 添加i18n导入', () => {
    const context = createContext();
    const ast = { program: { body: [] } };

    addI18nImport(ast, context);

    assert.strictEqual(ast.program.body.length, 1);
    assert(t.isImportDeclaration(ast.program.body[0]));
  });
});
