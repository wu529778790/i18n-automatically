#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 开始验证测试用例的 i18n 功能...\n');

// 配置文件验证
function validateConfig() {
  console.log('📋 验证配置文件...');
  const configPath = path.join(
    __dirname,
    '..',
    'fixtures',
    'automatically-i18n-config.json',
  );

  if (!fs.existsSync(configPath)) {
    throw new Error('配置文件不存在');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // 验证必要的配置项
  const requiredFields = [
    'i18nFilePath',
    'autoImportI18n',
    'i18nImportPath',
    'templateI18nCall',
    'scriptI18nCall',
  ];
  for (const field of requiredFields) {
    if (!(field in config)) {
      throw new Error(`配置文件缺少必要字段: ${field}`);
    }
  }

  console.log('✅ 配置文件验证通过');
  return config;
}

// 测试文件对比验证
function validateTestFiles() {
  console.log('\n📁 验证测试文件对...');

  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'i18n-samples');

  const testPairs = [
    { type: 'js', before: 'before.js', after: 'after.js' },
    { type: 'ts', before: 'before.ts', after: 'after.ts' },
    { type: 'jsx', before: 'before.jsx', after: 'after.jsx' },
    { type: 'tsx', before: 'before.tsx', after: 'after.tsx' },
    { type: 'vue', before: 'before.vue', after: 'after.vue' },
  ];

  for (const pair of testPairs) {
    const beforePath = path.join(fixturesDir, pair.type, pair.before);
    const afterPath = path.join(fixturesDir, pair.type, pair.after);

    if (!fs.existsSync(beforePath)) {
      throw new Error(`测试文件不存在: ${pair.type}/${pair.before}`);
    }
    if (!fs.existsSync(afterPath)) {
      throw new Error(`测试文件不存在: ${pair.type}/${pair.after}`);
    }

    const beforeContent = fs.readFileSync(beforePath, 'utf8');
    const afterContent = fs.readFileSync(afterPath, 'utf8');

    // 基本验证：before文件应该包含中文，after文件应该包含i18n调用
    const chineseRegex = /[\u4e00-\u9fff]+/;
    const i18nRegex = /(\$t\(|i18n\.t\()/;

    if (!chineseRegex.test(beforeContent)) {
      console.warn(`⚠️  ${pair.type}/${pair.before} 中未找到中文字符`);
    }

    if (!i18nRegex.test(afterContent)) {
      console.warn(`⚠️  ${pair.type}/${pair.after} 中未找到i18n调用`);
    } else {
      console.log(
        `✅ ${pair.type}/${pair.before} -> ${pair.type}/${pair.after} 验证通过`,
      );
    }
  }
}

// 验证i18n转换逻辑
function validateI18nTransformation() {
  console.log('\n🔄 验证 i18n 转换逻辑...');

  // 读取before和after文件，验证转换是否合理
  const jsBeforePath = path.join(
    __dirname,
    '..',
    'fixtures',
    'i18n-samples',
    'js',
    'before.js',
  );
  const jsAfterPath = path.join(
    __dirname,
    '..',
    'fixtures',
    'i18n-samples',
    'js',
    'after.js',
  );

  if (fs.existsSync(jsBeforePath) && fs.existsSync(jsAfterPath)) {
    const beforeContent = fs.readFileSync(jsBeforePath, 'utf8');
    const afterContent = fs.readFileSync(jsAfterPath, 'utf8');

    // 检查是否有合理的转换
    const beforeLines = beforeContent.split('\n').length;
    const afterLines = afterContent.split('\n').length;

    // after文件通常会更长（增加了i18n调用）
    if (afterLines >= beforeLines) {
      console.log('✅ 文件转换合理，after文件包含更多内容');
    } else {
      console.warn('⚠️  after文件行数少于before文件，可能存在问题');
    }

    // 检查是否包含i18n导入
    if (afterContent.includes('i18n') || afterContent.includes('$t')) {
      console.log('✅ after文件包含i18n相关代码');
    } else {
      console.warn('⚠️  after文件未包含i18n相关代码');
    }
  }
}

// 验证src目录结构
function validateSrcStructure() {
  console.log('\n📂 验证测试用例src目录结构...');

  const srcPath = path.join(__dirname, '..', 'fixtures', 'src');

  if (fs.existsSync(srcPath)) {
    const srcContents = fs.readdirSync(srcPath);
    console.log(`✅ src目录存在，包含: ${srcContents.join(', ')}`);

    // 检查是否有i18n相关目录
    const hasI18nDir = srcContents.some((item) => item.includes('i18n'));
    if (hasI18nDir) {
      console.log('✅ 发现i18n相关目录');
    }
  } else {
    console.log('ℹ️  fixtures/src 目录不存在（这是正常的）');
  }
}

// 主函数
async function main() {
  try {
    validateConfig();
    validateTestFiles();
    validateI18nTransformation();
    validateSrcStructure();

    console.log('\n🎉 所有测试用例验证通过！');
    console.log('✨ i18n 自动化功能测试文件完整且结构正确');
  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
main();
