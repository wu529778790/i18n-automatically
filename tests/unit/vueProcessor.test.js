const assert = require('assert');
const {
  processVueTemplate,
  processTextNode,
  processInterpolationNode,
  processElementNode,
  processAttribute,
  processDirective,
  handlerForJs,
  replaceChineseWithI18nKey,
  interpolationStr,
} = require('../../src/script/I18nProcessor/vueProcessor.js');

suite('Vue处理器核心功能最小化测试套件', () => {
  const createContext = () => ({
    config: { templateI18nCall: 't', scriptI18nCall: 't' },
    translations: new Map(),
    index: 0,
    filePath: 'test.vue',
    fileUuid: '123456',
  });

  test('processVueTemplate - 基本模板处理', async () => {
    const context = createContext();
    const templateAst = [{ type: 2, content: '你好，世界' }];
    const descriptor = { template: { content: '你好，世界' } };

    await processVueTemplate(templateAst, context, descriptor);

    assert.strictEqual(context.translations.size, 1);
    assert.match(context.contentChanged, /\{\{t\('test-123456-1'\)\}\}/);
  });

  test('processTextNode - 中文文本节点处理', () => {
    const context = createContext();
    const node = { content: '你好，世界' };

    const result = processTextNode(node, context);

    assert.match(result, /\{\{t\('test-123456-1'\)\}\}/);
    assert.strictEqual(context.translations.size, 1);
  });

  test('processInterpolationNode - 插值节点处理', () => {
    const context = createContext();
    const node = {
      content: { content: '你好，${name}' },
      loc: { source: '{{ 你好，${name} }}' },
    };

    const result = processInterpolationNode(node, context);

    assert.match(result, /\{\{`\$\{t\('test-123456-1'\)\}\$\{name\}`\}\}/);
    assert.strictEqual(context.translations.size, 1);
  });

  test('processElementNode - 基本元素节点处理', () => {
    const context = createContext();
    const node = {
      tag: 'div',
      props: [{ type: 6, name: 'title', value: { content: '你好' } }],
      children: [{ type: 2, content: '世界' }],
    };

    const result = processElementNode(node, context);

    assert.match(
      result,
      /<div\s+:title="t\('test-123456-1'\)"\s*>\s*\{\{t\('test-123456-2'\)\}\}\s*<\/div>/,
    );
    assert.strictEqual(context.translations.size, 2);
  });

  test('processAttribute - 属性处理', () => {
    const context = createContext();
    const prop = { name: 'title', value: { content: '你好' } };

    const result = processAttribute(prop, context);

    assert.strictEqual(result, '\n:title="t(\'test-123456-1\')"');
    assert.strictEqual(context.translations.size, 1);
  });

  test('processDirective - 指令处理', () => {
    const context = createContext();
    const prop = {
      name: 'bind',
      arg: { content: 'title' },
      exp: { content: '"你好"' },
    };

    const result = processDirective(prop, context);

    assert.strictEqual(result, '\n:title="t(\'test-123456-1\')"');
    assert.strictEqual(context.translations.size, 1);
  });

  test('handlerForJs - JS内容处理', () => {
    const context = createContext();
    const node = { content: "'你好'" };

    const result = handlerForJs(node, context);

    assert.match(result, /\nt\('test-123456-1'\)/);
    assert.strictEqual(context.translations.size, 1);
  });

  test('replaceChineseWithI18nKey - 中文替换', () => {
    const context = createContext();
    const input = "{ title: '你好' }";

    const result = replaceChineseWithI18nKey(input, context);

    assert.match(result, /\{ title: t\('test-123456-1'\) \}/);
    assert.strictEqual(context.translations.size, 1);
  });

  test('interpolationStr - 插值字符串处理', () => {
    const context = createContext();
    const input = '你好，${name}';

    const result = interpolationStr(input, context);

    assert.strictEqual(result, "${t('test-123456-1')}${name}");
    assert.strictEqual(context.translations.size, 1);
  });
});
