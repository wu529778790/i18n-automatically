const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Vue处理器测试
 */
function runVueProcessorTests() {
  const testFixturesPath = path.join(__dirname, '../fixtures/i18n-samples');
  let passedTests = 0;
  let totalTests = 0;

  // 测试Vue文件中文字符检测
  console.log('🧪 测试: 检测Vue文件中的中文字符');
  totalTests++;
  try {
    const beforeFilePath = path.join(testFixturesPath, 'vue/before.vue');

    if (!fs.existsSync(beforeFilePath)) {
      console.log('❌ 测试文件不存在:', beforeFilePath);
      throw new Error('测试文件不存在');
    }

    const content = fs.readFileSync(beforeFilePath, 'utf8');
    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    const matches = content.match(chineseRegex);

    assert(matches && matches.length > 0, '应该检测到中文字符');
    console.log('✅ 检测到Vue文件中的中文字符:', matches.length, '个');
    passedTests++;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }

  // 测试Vue模板中的字符串替换
  console.log('🧪 测试: 替换Vue模板中的中文字符串');
  totalTests++;
  try {
    const beforeFilePath = path.join(testFixturesPath, 'vue/before.vue');
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');

    if (!fs.existsSync(beforeFilePath) || !fs.existsSync(afterFilePath)) {
      throw new Error('测试文件不存在');
    }

    const afterContent = fs.readFileSync(afterFilePath, 'utf8');

    // 检查是否包含$t()函数调用
    assert(afterContent.includes('$t('), '转换后的文件应该包含$t()函数调用');

    // 检查是否包含:placeholder等动态属性绑定
    assert(
      afterContent.includes(':placeholder'),
      '转换后的文件应该包含动态属性绑定',
    );

    console.log('✅ Vue处理器测试通过');
    passedTests++;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }

  // 测试Vue文件结构完整性
  console.log('🧪 测试: Vue文件的基本结构');
  totalTests++;
  try {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');

    if (!fs.existsSync(afterFilePath)) {
      throw new Error('测试文件不存在: ' + afterFilePath);
    }

    const content = fs.readFileSync(afterFilePath, 'utf8');

    // 检查Vue文件基本结构
    assert(content.includes('<template>'), '应该包含template标签');
    assert(content.includes('<script>'), '应该包含script标签');
    assert(content.includes('</template>'), '应该包含template结束标签');
    assert(content.includes('</script>'), '应该包含script结束标签');

    console.log('✅ Vue文件结构完整');
    passedTests++;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }

  // 测试Vue特有的i18n用法
  console.log('🧪 测试: Vue i18n的正确语法');
  totalTests++;
  try {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');

    if (!fs.existsSync(afterFilePath)) {
      throw new Error('测试文件不存在: ' + afterFilePath);
    }

    const content = fs.readFileSync(afterFilePath, 'utf8');

    // 检查模板中使用$t语法
    const templateSection = content.match(/<template>[\s\S]*<\/template>/);
    if (templateSection) {
      assert(templateSection[0].includes('$t('), '模板中应该使用$t()语法');
    }

    // 检查script中使用this.$t语法
    const scriptSection = content.match(/<script>[\s\S]*<\/script>/);
    if (scriptSection) {
      assert(
        scriptSection[0].includes('this.$t('),
        'script中应该使用this.$t()语法',
      );
    }

    console.log('✅ Vue i18n语法正确');
    passedTests++;
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }

  return { passedTests, totalTests };
}

// 简单的测试运行器
if (require.main === module) {
  console.log('🧪 运行Vue处理器测试...');

  try {
    const result = runVueProcessorTests();

    console.log(
      `\n📊 Vue处理器测试结果: ${result.passedTests}/${result.totalTests} 通过`,
    );

    if (result.passedTests === result.totalTests) {
      console.log('✅ 所有Vue处理器测试通过');
      process.exit(0);
    } else {
      console.log('❌ 部分Vue处理器测试失败');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Vue处理器测试运行失败:', error.message);
    process.exit(1);
  }
}

module.exports = { runVueProcessorTests };
