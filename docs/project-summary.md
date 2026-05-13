# i18n-automatically 项目总结

## 一句话介绍

VS Code 国际化插件，一键扫描前端代码中的中文，自动替换为 i18n 翻译函数调用，并生成/更新多语言 JSON 文件。

## 解决的问题

前端国际化流程中最繁琐的三个步骤：**提取中文 → 替换为翻译 key → 生成语言包**，全部自动化。用户右键点击即可完成整个流程。

## 技术栈

| 层面 | 技术 |
|---|---|
| 插件平台 | VS Code Extension API (`^1.69.0`) |
| 语言 | JavaScript (CommonJS) + JSDoc 类型注解 |
| AST 解析 | Babel（JS/JSX/TS/TSX）+ Vue Compiler（.vue） |
| 代码格式化 | Prettier（读取用户项目配置，standalone 降级） |
| 翻译服务 | Google（免费）/ 百度 / DeepL，工厂模式可扩展 |
| 构建 | esbuild（Prettier 外部化以保留运行时配置解析能力） |
| CI/CD | GitHub Actions（main 自动发版到 Marketplace + Open VSX） |

## 核心功能

1. **单文件扫描**：扫描当前编辑器文件，替换中文为 i18n key，写入 `zh.json`
2. **批量扫描**：选择文件夹，递归扫描所有支持的文件，带进度条
3. **多格式支持**：`.js`、`.jsx`、`.ts`、`.tsx`、`.vue`
4. **智能中文检测**：过滤图片路径、字体名、日期格式、console/debugger 上下文
5. **DOM 感知**：含 HTML 标签的字符串会拆分，只翻译文本内容
6. **模板字符串支持**：处理反引号内的中文，插入 i18n 调用作为模板表达式
7. **JSX 支持**：处理 `JSXText`、`JSXAttribute`、`JSXExpressionContainer`
8. **Vue 模板支持**：处理文本节点、插值、属性、指令（v-bind、v-on、v-model 等）
9. **自动导入**：自动添加 `import i18n from '@/i18n'`
10. **三种翻译服务**：免费 Google（无需配置）、百度翻译、DeepL 翻译
11. **增量翻译**：只翻译目标语言文件中不存在的 key
12. **语言切换 + 内联预览**：VS Code 装饰器在编辑器中显示翻译文本
13. **两种 key 生成策略**：组件名模式（`ComponentName-uuid-index`）或 MD5 模式（去重）

## 架构设计

```
src/
  extension.js                          -- 入口：注册所有命令
  utils/index.js                        -- 工具函数
  script/
    setting.js                          -- 配置管理（读写 + 自动创建）
    scanChinese.js                      -- 单文件扫描
    scanChineseBatch.js                 -- 批量扫描 + 进度 UI
    switchLanguage.js                   -- 语言切换 + 内联装饰
    I18nProcessor/
      index.js                          -- 编排器：文件类型分发、Prettier、写入
      common.js                         -- 共享：generateKey()、containsChinese()、TranslationManager
      jsProcessor.js                    -- Babel AST 处理 JS/JSX/TS/TSX
      vueProcessor.js                   -- Vue SFC 处理（compiler-sfc + compiler-dom）
    generateLanguagePackage/
      index.js                          -- 编排：读 zh.json → 选翻译服务 → 写目标 JSON
      api/
        baidu.js                        -- 百度翻译 API（MD5 签名）
        freeGoogle.js                   -- 免费 Google 翻译
        deepl.js                        -- DeepL API
      translators/
        index.js                        -- 工厂模式：createTranslator(serviceName)
        baiduTranslator.js
        googleTranslator.js
        deeplTranslator.js
```

## 数据流

```
用户触发（右键/命令面板）
    → 扫描文件（scanChinese / scanChineseBatch）
    → AST 解析（Babel / Vue Compiler）
    → 遍历中文节点（StringLiteral / TemplateElement / JSXText / Vue 文本节点...）
    → 替换为 i18n 函数调用（$t / t / i18n.global.t）
    → 自动插入 import 语句
    → Prettier 格式化（读取用户配置，超时降级）
    → 写回源文件
    → TranslationManager 写入 zh.json
    → 翻译服务批量翻译（每批 20 条）
    → 写入目标语言 JSON
```

## 技术亮点（面试可聊）

### 1. 双 AST 引擎
Babel 处理 JS/JSX/TS/TSX，Vue Compiler 处理 `.vue` 文件。每个引擎针对自己的文件类型优化，但 Vue 模板处理是字符串重建式的（手动从 AST 节点重建模板）。

### 2. 工厂模式的翻译服务
`createTranslator(serviceName)` 统一接口，新增翻译服务只需实现一个类，不需要修改核心逻辑。符合开闭原则。

### 3. 防御式 Babel traverse 解析
`jsProcessor.js` 中 `resolveTraverseDeep()` 递归解析 `@babel/traverse` 的多种导出形态（CJS/ESM/嵌套 default），解决了 esbuild 打包 Babel 包时的模块兼容问题。

### 4. Prettier 降级链
尝试 (a) `prettier.resolveConfig` → (b) 手动加载 `.prettierrc.js` → (c) standalone + 显式插件，每步都有超时保护（1.2s / 2s）。确保在不同项目配置下都能工作。

### 5. Visitor 错误隔离
每个 Babel visitor 用 `runSafely()` 包裹，单个节点解析失败不影响整个文件遍历。提升了工具对边缘 case 的容错性。

### 6. 可配置的 Callee 构建
`buildCalleeFromString()` 动态构建 Babel AST 节点，支持 `$t`、`t`、`i18n.global.t`、`this.$t` 等任意点号路径的翻译函数调用。

### 7. esbuild 打包策略
Prettier 外部化（保留运行时配置解析能力），Babel 内联打包（避免与用户环境版本冲突）。

## 面试 Q&A 预备

**Q: 为什么选择 Babel 而不是正则匹配？**
A: 正则无法准确识别代码上下文（字符串 vs 注释 vs 变量名），Babel AST 解析能精确定位所有中文出现的节点类型，避免误替换。

**Q: Vue 文件为什么不用 Babel 统一处理？**
A: Vue SFC 有独特的 template/script/style 三段结构，template 的指令（v-if、v-for 等）和插值语法不是标准 JS，需要用 Vue 官方编译器解析。

**Q: 如何保证格式化后的代码风格一致？**
A: 集成 Prettier，读取用户项目已有的 Prettier 配置。如果项目没有配置，降级到 standalone 模式。有超时保护防止配置解析卡住。

**Q: 大量文件的批量处理性能如何？**
A: 批量扫描带 VS Code 进度条，翻译按每批 20 条分批处理并渐进写入，避免一次性大量 API 调用失败导致数据丢失。
