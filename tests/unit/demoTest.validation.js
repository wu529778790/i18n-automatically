const fs = require('fs');
const path = require('path');

/**
 * 测试用例验证工具
 * 验证所有必要的测试文件和目录结构是否正确
 */
class DemoTestValidator {
  constructor() {
    this.testRoot = path.join(__dirname, '..');
    this.fixturesPath = path.join(this.testRoot, 'fixtures/i18n-samples');
    this.errors = [];
    this.warnings = [];
  }

  // 验证目录结构
  validateDirectoryStructure() {
    console.log('🔍 验证目录结构...');

    const requiredDirs = [
      'fixtures',
      'fixtures/i18n-samples',
      'fixtures/i18n-samples/js',
      'fixtures/i18n-samples/ts',
      'fixtures/i18n-samples/jsx',
      'fixtures/i18n-samples/tsx',
      'fixtures/i18n-samples/vue',
      'unit',
      'integration',
    ];

    requiredDirs.forEach((dir) => {
      const dirPath = path.join(this.testRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`缺少目录: ${dir}`);
      } else {
        console.log(`✅ 目录存在: ${dir}`);
      }
    });
  }

  // 验证测试样例文件
  validateTestFiles() {
    console.log('🔍 验证测试样例文件...');

    const fileTypes = ['js', 'ts', 'jsx', 'tsx', 'vue'];
    const versions = ['before', 'after'];

    fileTypes.forEach((type) => {
      versions.forEach((version) => {
        const fileName = `${version}.${type}`;
        const filePath = path.join(this.fixturesPath, type, fileName);

        if (!fs.existsSync(filePath)) {
          this.errors.push(`缺少测试文件: ${type}/${fileName}`);
        } else {
          console.log(`✅ 测试文件存在: ${type}/${fileName}`);
          this.validateFileContent(filePath, type, version);
        }
      });
    });
  }

  // 验证文件内容
  validateFileContent(filePath, type, version) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (version === 'before') {
        // 验证"before"文件应该包含中文
        const chineseRegex = /[\u4e00-\u9fa5]+/g;
        const matches = content.match(chineseRegex);

        if (!matches || matches.length === 0) {
          this.warnings.push(`${type}/${version}.${type} 文件中没有中文字符`);
        } else {
          console.log(
            `  📝 ${type}/${version}.${type} 包含 ${matches.length} 个中文字符串`,
          );
        }
      } else if (version === 'after') {
        // 验证"after"文件应该包含i18n函数调用
        const hasI18nCall = content.includes('t(') || content.includes('$t(');

        if (!hasI18nCall) {
          this.warnings.push(
            `${type}/${version}.${type} 文件中没有i18n函数调用`,
          );
        } else {
          console.log(`  📝 ${type}/${version}.${type} 包含i18n函数调用`);
        }
      }

      // 验证文件类型特定的内容
      this.validateTypeSpecificContent(content, type, version);
    } catch (error) {
      this.errors.push(`读取文件失败: ${filePath} - ${error.message}`);
    }
  }

  // 验证特定文件类型的内容
  validateTypeSpecificContent(content, type, version) {
    switch (type) {
      case 'vue':
        if (!content.includes('<template>') || !content.includes('<script>')) {
          this.warnings.push(`Vue文件缺少必要的template或script标签`);
        }
        break;
      case 'tsx':
      case 'jsx':
        if (version === 'after' && !content.includes('React')) {
          this.warnings.push(`${type}文件可能缺少React导入`);
        }
        break;
      case 'ts':
        // TypeScript特定验证
        break;
      case 'js':
        // JavaScript特定验证
        break;
    }
  }

  // 验证配置文件
  validateConfigFiles() {
    console.log('🔍 验证配置文件...');

    const configPath = path.join(
      this.testRoot,
      'fixtures/automatically-i18n-config.json',
    );

    if (!fs.existsSync(configPath)) {
      this.errors.push('缺少配置文件: automatically-i18n-config.json');
      return;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      // 验证必要的配置项
      const requiredFields = [
        'localePath',
        'languages',
        'defaultLanguage',
        'supportedFileTypes',
      ];

      requiredFields.forEach((field) => {
        if (!config[field]) {
          this.warnings.push(`配置文件缺少字段: ${field}`);
        } else {
          console.log(`✅ 配置字段存在: ${field}`);
        }
      });

      console.log(`✅ 配置文件验证通过`);
    } catch (error) {
      this.errors.push(`配置文件格式错误: ${error.message}`);
    }
  }

  // 验证单元测试文件
  validateUnitTests() {
    console.log('🔍 验证单元测试文件...');

    const unitTestFiles = [
      'unit/jsProcessor.test.js',
      'unit/vueProcessor.test.js',
    ];

    unitTestFiles.forEach((testFile) => {
      const testPath = path.join(this.testRoot, testFile);

      if (!fs.existsSync(testPath)) {
        this.errors.push(`缺少单元测试文件: ${testFile}`);
      } else {
        console.log(`✅ 单元测试文件存在: ${testFile}`);

        // 验证测试文件内容
        try {
          const content = fs.readFileSync(testPath, 'utf8');

          if (!content.includes('describe') && !content.includes('it')) {
            this.warnings.push(`${testFile} 可能不是有效的测试文件`);
          }
        } catch (error) {
          this.errors.push(`读取测试文件失败: ${testFile} - ${error.message}`);
        }
      }
    });
  }

  // 生成语言包示例文件
  generateLanguagePackageExample() {
    console.log('🔍 生成语言包示例...');

    const localesPath = path.join(this.testRoot, 'fixtures/locales');

    if (!fs.existsSync(localesPath)) {
      fs.mkdirSync(localesPath, { recursive: true });
    }

    const exampleTranslations = {
      'zh-CN': {
        user_management_system: '用户管理系统',
        welcome_message: '欢迎使用我们的应用程序',
        delete_user: '删除用户',
        confirm_delete: '确认删除吗？',
        tooltip_message: '这是一个提示',
        hover_for_tip: '鼠标悬停查看提示',
        enter_username: '请输入用户名',
        content_area: '内容区域',
        current_status: '当前状态',
        active: '活跃',
        inactive: '非活跃',
      },
      'en-US': {
        user_management_system: 'User Management System',
        welcome_message: 'Welcome to our application',
        delete_user: 'Delete User',
        confirm_delete: 'Are you sure you want to delete?',
        tooltip_message: 'This is a tooltip',
        hover_for_tip: 'Hover to view tooltip',
        enter_username: 'Please enter username',
        content_area: 'Content Area',
        current_status: 'Current Status',
        active: 'Active',
        inactive: 'Inactive',
      },
    };

    Object.keys(exampleTranslations).forEach((lang) => {
      const langFile = path.join(localesPath, `${lang}.json`);
      fs.writeFileSync(
        langFile,
        JSON.stringify(exampleTranslations[lang], null, 2),
        'utf8',
      );
      console.log(`✅ 生成语言包: ${lang}.json`);
    });
  }

  // 运行所有验证
  runValidation() {
    console.log('🧪 开始运行测试用例验证...\n');

    this.validateDirectoryStructure();
    this.validateTestFiles();
    this.validateConfigFiles();
    this.validateUnitTests();
    this.generateLanguagePackageExample();

    console.log('\n📊 验证结果汇总:');

    if (this.errors.length > 0) {
      console.log('\n❌ 发现错误:');
      this.errors.forEach((error) => console.log(`  • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告信息:');
      this.warnings.forEach((warning) => console.log(`  • ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log('\n🎉 所有测试用例验证通过！');
      return true;
    } else {
      console.log('\n💥 测试用例验证失败！');
      return false;
    }
  }
}

// 运行验证
if (require.main === module) {
  const validator = new DemoTestValidator();
  const isValid = validator.runValidation();

  if (!isValid) {
    process.exit(1);
  }
}

module.exports = DemoTestValidator;
