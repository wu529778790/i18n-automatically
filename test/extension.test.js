const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
  containsChinese,
  generateKey,
  TranslationManager,
  stringWithDom,
} = require('../src/script/I18nProcessor/common.js');
const { processJsAst } = require('../src/script/I18nProcessor/jsProcessor.js');
const { readConfig } = require('../src/script/setting.js');

suite('I18n处理器核心功能测试套件', () => {
  const outputPath = path.join(__dirname, 'output');

  setup(() => {
    readConfig();
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
  });

  teardown(() => {
    if (fs.existsSync(outputPath)) {
      fs.rmdirSync(outputPath, { recursive: true });
    }
  });

  test('containsChinese函数测试', () => {
    assert.strictEqual(containsChinese('Hello World'), false);
    assert.strictEqual(containsChinese('你好，世界'), true);
    assert.strictEqual(containsChinese('Hello 世界'), true);
    assert.strictEqual(containsChinese('image.png'), false);
    assert.strictEqual(containsChinese('图片.jpg'), false);
    assert.strictEqual(containsChinese('文件.png'), false);
  });

  test('generateKey函数测试', () => {
    const context = {
      filePath: '\\path\\to\\component\\MyComponent.vue',
      fileUuid: '123456',
      config: { keyFilePathLevel: 2 },
      index: 0,
    };
    const key1 = generateKey(context);
    const key2 = generateKey(context);
    assert.notStrictEqual(key1, key2);
    assert.match(key1, /component-MyComponent-123456-1/);
    assert.match(key2, /component-MyComponent-123456-2/);
  });

  test('TranslationManager输出测试', async () => {
    const translations = new Map([
      ['key1', '你好'],
      ['key2', '世界'],
    ]);
    const config = {
      i18nFilePath: outputPath,
      locale: 'zh',
    };

    const manager = new TranslationManager();
    await manager.outputTranslationFile(translations, config);

    const outputFile = path.join(outputPath, 'locale', 'zh.json');
    assert.strictEqual(fs.existsSync(outputFile), true);

    const content = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
    assert.deepStrictEqual(content, { key1: '你好', key2: '世界' });
  });

  test('stringWithDom函数测试', () => {
    assert.strictEqual(stringWithDom('Hello World'), false);
    assert.strictEqual(stringWithDom('<div>你好</div>'), true);
    assert.strictEqual(stringWithDom('Text with <span>tag</span>'), true);
    assert.strictEqual(stringWithDom('No HTML here'), false);
  });

  test('处理简单字符串的processJsAst测试', () => {
    const context = {
      filePath: 'test.js',
      fileUuid: '123456',
      config: { scriptI18nCall: 't', keyFilePathLevel: 2 },
      index: 0,
      translations: new Map(),
      contentSource: "const message = '你好，世界';",
    };
    const result = processJsAst(context);
    assert.strictEqual(result.translations.size, 1);
    assert.match(
      result.contentChanged,
      /const message = t\('test-123456-1'\);/,
    );
  });

  test('处理模板字符串的processJsAst测试', () => {
    const context = {
      filePath: 'test.js',
      fileUuid: '123456',
      config: { scriptI18nCall: 't', keyFilePathLevel: 2 },
      index: 0,
      translations: new Map(),
      contentSource: 'const message = `你好，${name}`;',
    };

    const result = processJsAst(context);
    assert.strictEqual(result.translations.size, 1);
    assert.match(
      result.contentChanged,
      /const message = `\${t\('test-123456-1'\)}\${name}`;/,
    );
  });
});
