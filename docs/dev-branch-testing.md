# Dev分支测试 GitHub Action

## 概述

这个GitHub Action专门用于监听`dev`分支的变化并自动运行完整的测试套件，确保代码质量和功能正确性。

## 触发条件

此Action会在以下情况下自动运行：

1. **Push到dev分支** - 当代码推送到dev分支时
2. **针对dev分支的Pull Request** - 当创建或更新指向dev分支的PR时
3. **手动触发** - 可以在GitHub Actions页面手动运行

## 测试内容

### 1. 代码质量检查

- **ESLint检查** - 运行`yarn lint`检查代码风格和潜在问题
- **依赖安装** - 验证项目依赖能否正确安装

### 2. VS Code扩展测试

- **扩展功能测试** - 运行`yarn test`执行VS Code扩展相关测试
- **扩展打包测试** - 验证扩展能否正确打包为.vsix文件

### 3. 测试用例验证

这是本项目的核心测试部分，验证i18n自动化功能：

#### 配置文件验证

- 检查`tests/fixtures/automatically-i18n-config.json`存在性和格式正确性
- 验证必要配置字段的完整性

#### 测试文件对验证

验证以下文件对的存在性和正确性：

- `tests/fixtures/i18n-samples/js/before.js` ↔ `after.js`
- `tests/fixtures/i18n-samples/ts/before.ts` ↔ `after.ts`
- `tests/fixtures/i18n-samples/jsx/before.jsx` ↔ `after.jsx`
- `tests/fixtures/i18n-samples/tsx/before.tsx` ↔ `after.tsx`
- `tests/fixtures/i18n-samples/vue/before.vue` ↔ `after.vue`

#### i18n转换逻辑验证

- 检查before文件是否包含中文内容
- 验证after文件是否包含正确的i18n调用（`$t()`或`i18n.t()`）
- 确保转换过程的合理性

### 4. 单元测试

- 运行`tests/unit/jsProcessor.test.js` - JS文件处理器测试
- 运行`tests/unit/vueProcessor.test.js` - Vue文件处理器测试
- 运行`tests/unit/demoTest.validation.js` - 测试用例验证脚本

## 工作流文件

测试配置位于：`.github/workflows/test-dev-branch.yaml`

## 手动运行测试

您也可以在本地手动运行相关测试：

```bash
# 代码质量检查
yarn lint

# VS Code扩展测试
yarn test

# 测试用例专项验证
node tests/unit/demoTest.validation.js

# 扩展打包测试
npm install -g @vscode/vsce
vsce package --out test-extension.vsix
```

## 测试结果

测试成功时，您会看到：

- ✅ 所有检查项目的通过状态
- 📊 详细的测试报告
- 🎉 测试完成总结

测试失败时，Action会：

- ❌ 显示具体的失败原因
- 🔍 提供详细的错误信息
- 🚫 阻止不合格代码的合并

## 注意事项

1. **文件命名** - 注意`test-jsx-befor.jsx`的拼写（保持与原文件一致）
2. **中文内容** - before文件应包含中文内容用于测试转换
3. **i18n调用** - after文件应包含正确的i18n函数调用
4. **配置完整性** - 确保配置文件包含所有必要字段

## 扩展此测试

如需添加更多测试：

1. 在相应的测试步骤中添加新的验证逻辑
2. 更新`tests/unit/demoTest.validation.js`脚本
3. 确保新测试与现有测试兼容

这个测试action确保了i18n自动化功能的稳定性和正确性，为项目的持续集成提供了可靠保障。
