#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 国际化插件测试运行器
 * 统一运行所有测试用例
 */
class I18nTestRunner {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // 记录测试结果
  recordTest(name, passed, message = '') {
    this.totalTests++;
    const result = {
      name,
      passed,
      message,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);

    if (passed) {
      this.passedTests++;
      console.log(`✅ ${name}`);
      if (message) console.log(`   ${message}`);
    } else {
      this.failedTests++;
      console.log(`❌ ${name}`);
      if (message) console.log(`   ${message}`);
    }
  }

  // 运行单个测试文件
  runTestFile(testFile, description) {
    try {
      console.log(`\n🧪 运行测试: ${description}`);
      const testPath = path.join(__dirname, testFile);

      if (!fs.existsSync(testPath)) {
        this.recordTest(description, false, `测试文件不存在: ${testFile}`);
        return;
      }

      // 执行测试文件
      execSync(`node "${testPath}"`, { stdio: 'pipe' });
      this.recordTest(description, true, '测试通过');
    } catch (error) {
      this.recordTest(description, false, `测试失败: ${error.message}`);
    }
  }

  // 验证文件存在性
  verifyFiles() {
    console.log('\n🔍 验证测试文件结构...');

    const requiredFiles = [
      {
        path: 'fixtures/i18n-samples/js/before.js',
        desc: 'JS测试文件(before)',
      },
      { path: 'fixtures/i18n-samples/js/after.js', desc: 'JS测试文件(after)' },
      {
        path: 'fixtures/i18n-samples/vue/before.vue',
        desc: 'Vue测试文件(before)',
      },
      {
        path: 'fixtures/i18n-samples/vue/after.vue',
        desc: 'Vue测试文件(after)',
      },
      { path: 'fixtures/automatically-i18n-config.json', desc: '配置文件' },
      { path: 'unit/jsProcessor.test.js', desc: 'JS处理器测试' },
      { path: 'unit/vueProcessor.test.js', desc: 'Vue处理器测试' },
    ];

    requiredFiles.forEach((file) => {
      const filePath = path.join(__dirname, file.path);
      const exists = fs.existsSync(filePath);
      this.recordTest(
        `文件存在: ${file.desc}`,
        exists,
        exists ? '' : `文件不存在: ${file.path}`,
      );
    });
  }

  // 验证中文字符检测
  verifyChinese() {
    console.log('\n🔍 验证中文字符检测...');

    const testFiles = [
      'fixtures/i18n-samples/js/before.js',
      'fixtures/i18n-samples/vue/before.vue',
    ];

    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    let totalChinese = 0;

    testFiles.forEach((file) => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(chineseRegex);

        if (matches) {
          totalChinese += matches.length;
          this.recordTest(
            `中文检测: ${path.basename(file)}`,
            true,
            `发现 ${matches.length} 个中文字符`,
          );
        } else {
          this.recordTest(
            `中文检测: ${path.basename(file)}`,
            false,
            '未发现中文字符',
          );
        }
      } else {
        this.recordTest(
          `中文检测: ${path.basename(file)}`,
          false,
          '文件不存在',
        );
      }
    });

    this.recordTest(
      '总中文字符检测',
      totalChinese > 0,
      `总计发现 ${totalChinese} 个中文字符`,
    );
  }

  // 验证i18n转换
  verifyI18nConversion() {
    console.log('\n🔍 验证i18n转换...');

    const testFiles = [
      {
        file: 'fixtures/i18n-samples/js/after.js',
        pattern: 't(',
        desc: 'JS i18n转换',
      },
      {
        file: 'fixtures/i18n-samples/vue/after.vue',
        pattern: '$t(',
        desc: 'Vue i18n转换',
      },
    ];

    testFiles.forEach(({ file, pattern, desc }) => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasI18n = content.includes(pattern);
        this.recordTest(
          desc,
          hasI18n,
          hasI18n ? `包含${pattern}调用` : `不包含${pattern}调用`,
        );
      } else {
        this.recordTest(desc, false, '文件不存在');
      }
    });
  }

  // 验证配置文件
  verifyConfig() {
    console.log('\n🔍 验证配置文件...');

    const configPath = path.join(
      __dirname,
      'fixtures/automatically-i18n-config.json',
    );

    if (!fs.existsSync(configPath)) {
      this.recordTest('配置文件存在', false, '配置文件不存在');
      return;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      this.recordTest('配置文件JSON格式', true, 'JSON格式正确');

      const requiredFields = [
        'localePath',
        'languages',
        'defaultLanguage',
        'supportedFileTypes',
      ];
      requiredFields.forEach((field) => {
        const hasField = config[field] !== undefined;
        this.recordTest(
          `配置字段: ${field}`,
          hasField,
          hasField ? '字段存在' : '字段缺失',
        );
      });
    } catch (error) {
      this.recordTest(
        '配置文件JSON格式',
        false,
        `JSON格式错误: ${error.message}`,
      );
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 测试报告汇总');
    console.log('='.repeat(50));
    console.log(`📈 总测试数: ${this.totalTests}`);
    console.log(`✅ 通过: ${this.passedTests}`);
    console.log(`❌ 失败: ${this.failedTests}`);
    console.log(
      `📊 通过率: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`,
    );

    if (this.failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter((result) => !result.passed)
        .forEach((result) => {
          console.log(`  • ${result.name}: ${result.message}`);
        });
    }

    console.log('\n' + '='.repeat(50));

    if (this.failedTests === 0) {
      console.log('🎉 所有测试通过！');
      return true;
    } else {
      console.log('💥 部分测试失败，请检查上述错误！');
      return false;
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始运行i18n-automatically插件测试套件...\n');

    // 基础验证
    this.verifyFiles();
    this.verifyChinese();
    this.verifyI18nConversion();
    this.verifyConfig();

    // 运行单元测试
    this.runTestFile('unit/jsProcessor.test.js', 'JavaScript处理器测试');
    this.runTestFile('unit/vueProcessor.test.js', 'Vue处理器测试');
    this.runTestFile('unit/demoTest.validation.js', '演示测试验证');

    // 生成报告
    const allPassed = this.generateReport();

    // 返回退出码
    process.exit(allPassed ? 0 : 1);
  }
}

// 运行测试
if (require.main === module) {
  const runner = new I18nTestRunner();
  runner.runAllTests().catch((error) => {
    console.error('❌ 测试运行器发生错误:', error);
    process.exit(1);
  });
}

module.exports = I18nTestRunner;
