# i18n-automatically 测试用例说明

## 概述

本测试套件为 `i18n-automatically` VSCode 国际化插件提供全面的自动化测试，确保插件的核心功能正常工作。

## 测试结构

```
tests/
├── fixtures/                          # 测试数据
│   ├── i18n-samples/                  # 不同文件类型的测试样例
│   │   ├── js/                        # JavaScript 测试文件
│   │   │   ├── before.js              # 转换前的JS文件
│   │   │   └── after.js               # 转换后的JS文件
│   │   ├── ts/                        # TypeScript 测试文件
│   │   ├── jsx/                       # React JSX 测试文件
│   │   ├── tsx/                       # React TSX 测试文件
│   │   └── vue/                       # Vue 单文件组件测试
│   ├── locales/                       # 语言包示例
│   └── automatically-i18n-config.json # 插件配置文件
├── unit/                              # 单元测试
│   ├── jsProcessor.test.js            # JavaScript 处理器测试
│   ├── vueProcessor.test.js           # Vue 处理器测试
│   └── demoTest.validation.js         # 综合验证测试
├── integration/                       # 集成测试（预留）
├── run-tests.js                       # 统一测试运行器
└── README.md                          # 本说明文件
```

## 测试功能覆盖

### 1. 文件类型支持测试

- ✅ JavaScript (.js)
- ✅ TypeScript (.ts)
- ✅ React JSX (.jsx)
- ✅ React TSX (.tsx)
- ✅ Vue 单文件组件 (.vue)

### 2. 核心功能测试

- ✅ 中文字符检测
- ✅ 字符串提取
- ✅ i18n 函数调用转换
- ✅ 配置文件验证
- ✅ 语言包生成

### 3. 代码质量测试

- ✅ ESLint 代码检查
- ✅ 语法正确性验证
- ✅ 扩展打包测试

## 运行测试

### 本地运行

```bash
# 运行所有测试
npm run test:all

# 只运行单元测试
npm run test:unit

# 运行特定测试
npm run test:js        # JavaScript 处理器测试
npm run test:vue       # Vue 处理器测试
npm run test:i18n      # 国际化功能验证

# 运行 VSCode 扩展测试
npm run test

# 只运行代码检查
npm run lint
```

### GitHub Actions 自动测试

项目配置了两个 GitHub Actions 工作流：

1. **`test-dev-branch.yaml`** - 基础测试流程
2. **`comprehensive-i18n-tests.yaml`** - 全面测试流程

当代码推送到 `main` 或 `dev` 分支，或创建 Pull Request 时，会自动触发测试。

## 测试用例说明

### JavaScript 测试用例

**测试文件**: `fixtures/i18n-samples/js/`

- **before.js**: 包含中文字符串的原始 JavaScript 代码
- **after.js**: 转换后使用 `t()` 函数的国际化代码

**测试点**:

- 检测 console.log、alert 等函数中的中文
- 验证对象属性中的中文字符串
- 确认转换后的语法正确性

### Vue 测试用例

**测试文件**: `fixtures/i18n-samples/vue/`

- **before.vue**: 包含中文的 Vue 单文件组件
- **after.vue**: 使用 `$t()` 函数的国际化组件

**测试点**:

- 模板中的文本内容
- 属性绑定中的中文（title, placeholder 等）
- script 部分的字符串
- Vue 特有的 i18n 语法

### 配置文件测试

**测试文件**: `fixtures/automatically-i18n-config.json`

**验证内容**:

- JSON 格式正确性
- 必要配置字段存在
- 语言配置合理性
- 文件类型支持配置

## 添加新测试

### 添加新的文件类型测试

1. 在 `fixtures/i18n-samples/` 下创建新目录
2. 添加 `before.*` 和 `after.*` 文件
3. 更新 `run-tests.js` 中的文件类型列表
4. 创建对应的单元测试文件

### 添加新的功能测试

1. 在 `unit/` 目录下创建测试文件
2. 按照现有测试的模式编写测试逻辑
3. 更新 `run-tests.js` 调用新测试
4. 更新 `package.json` 中的测试脚本

## 测试最佳实践

### 测试文件编写原则

1. **完整性**: 测试文件应包含足够的中文字符串用例
2. **真实性**: 模拟真实的使用场景
3. **多样性**: 覆盖不同的语法结构和用法
4. **验证性**: 转换后的代码应该是有效的

### 测试断言

- 使用 Node.js 内置的 `assert` 模块
- 提供清晰的错误信息
- 包含正面和负面测试用例

## 故障排除

### 常见问题

1. **测试文件不存在**
   - 检查文件路径是否正确
   - 确认测试文件已正确创建

2. **中文字符检测失败**
   - 验证正则表达式 `/[\u4e00-\u9fa5]+/g`
   - 检查文件编码是否为 UTF-8

3. **GitHub Actions 失败**
   - 查看详细日志
   - 检查依赖安装是否成功
   - 验证测试环境配置

### 调试技巧

```bash
# 运行带详细输出的测试
node tests/run-tests.js

# 单独验证某个功能
node tests/unit/jsProcessor.test.js

# 检查配置文件
node -e "console.log(JSON.parse(require('fs').readFileSync('tests/fixtures/automatically-i18n-config.json', 'utf8')))"
```

## 贡献指南

1. 添加新测试时，确保测试覆盖率
2. 遵循现有的代码风格和命名规范
3. 更新相关文档
4. 确保所有测试通过后再提交

## 联系方式

如有问题或建议，请在 GitHub 仓库中创建 Issue。
