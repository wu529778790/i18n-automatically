# 项目目录结构

本文档描述了重新整理后的项目目录结构，以便更好地组织测试文件和文档。

## 📁 新的目录结构

```
i18n-automatically/
├── 📁 src/                          # 源代码目录
│   └── extension.js                 # VS Code扩展主文件
├── 📁 tests/                        # 统一的测试目录
│   ├── 📁 unit/                     # 单元测试
│   │   ├── jsProcessor.test.js      # JS文件处理器测试
│   │   ├── vueProcessor.test.js     # Vue文件处理器测试
│   │   └── demoTest.validation.js   # 测试用例验证脚本
│   ├── 📁 fixtures/                 # 测试用例和示例文件
│   │   ├── automatically-i18n-config.json  # 测试配置文件
│   │   ├── 📁 i18n-samples/         # i18n转换示例文件
│   │   │   ├── 📁 js/               # JavaScript示例
│   │   │   │   ├── before.js        # 转换前的JS文件
│   │   │   │   └── after.js         # 转换后的JS文件
│   │   │   ├── 📁 ts/               # TypeScript示例
│   │   │   │   ├── before.ts
│   │   │   │   └── after.ts
│   │   │   ├── 📁 jsx/              # JSX示例
│   │   │   │   ├── before.jsx
│   │   │   │   └── after.jsx
│   │   │   ├── 📁 tsx/              # TSX示例
│   │   │   │   ├── before.tsx
│   │   │   │   └── after.tsx
│   │   │   └── 📁 vue/              # Vue示例
│   │   │       ├── before.vue
│   │   │       └── after.vue
│   │   └── 📁 src/                  # 示例项目源码结构
│   │       └── 📁 i18n/             # i18n相关文件
│   └── 📁 helpers/                  # 测试辅助工具（预留）
├── 📁 docs/                         # 项目文档
│   ├── dev-branch-testing.md        # GitHub Actions测试说明
│   └── project-structure.md         # 本文档
├── 📁 .github/                      # GitHub配置
│   └── 📁 workflows/                # GitHub Actions工作流
│       ├── test-dev-branch.yaml     # dev分支测试工作流
│       └── auto-deploy-to-vscode-marketplace.yaml  # 自动部署工作流
├── 📁 public/                       # 公共资源
├── 📁 .vscode/                      # VS Code配置
├── package.json                     # 项目配置
├── README.md                        # 项目说明
└── ...                             # 其他配置文件
```

## 📋 目录重组说明

### 旧结构 → 新结构

| 旧路径 | 新路径 | 说明 |
|--------|--------|------|
| `test/` | `tests/unit/` | 单元测试文件统一放入unit子目录 |
| `demoTest/` | `tests/fixtures/` | 测试用例和示例文件移至fixtures |
| `demoTest/test-js-before.js` | `tests/fixtures/i18n-samples/js/before.js` | 按文件类型分类组织 |
| `demoTest/test-js-after.js` | `tests/fixtures/i18n-samples/js/after.js` | 按文件类型分类组织 |
| `demoTest/automatically-i18n-config.json` | `tests/fixtures/automatically-i18n-config.json` | 配置文件移至fixtures根目录 |

### 重组的优势

1. **清晰的分层结构** - 测试代码和测试数据分离
2. **类型化组织** - 按文件类型（js/ts/jsx/tsx/vue）分类
3. **标准化命名** - 使用通用的before/after命名模式
4. **易于扩展** - 新增测试类型可以轻松添加新目录
5. **符合惯例** - 遵循常见的项目组织模式

## 🔧 配置文件更新

以下文件已更新以适应新的目录结构：

### GitHub Actions

- `.github/workflows/test-dev-branch.yaml` - 更新了所有测试路径
- 验证脚本路径：`tests/unit/demoTest.validation.js`
- 配置文件路径：`tests/fixtures/automatically-i18n-config.json`

### 测试脚本

- `tests/unit/demoTest.validation.js` - 更新了所有引用路径
- 现在使用新的fixture目录结构进行验证

### 文档

- `docs/dev-branch-testing.md` - 更新了所有路径说明
- `docs/project-structure.md` - 本文档（新增）

## 🚀 使用方法

### 运行测试

```bash
# 运行单元测试
node tests/unit/jsProcessor.test.js
node tests/unit/vueProcessor.test.js

# 运行测试用例验证
node tests/unit/demoTest.validation.js

# 运行全套测试（通过GitHub Actions）
git push origin dev  # 或创建PR到dev分支
```

### 添加新测试用例

1. **添加新的文件类型支持**：

   ```bash
   mkdir tests/fixtures/i18n-samples/新类型
   # 添加before.ext和after.ext文件
   ```

2. **更新验证脚本**：
   编辑`tests/unit/demoTest.validation.js`，在`testPairs`数组中添加新类型

3. **更新GitHub Actions**：
   在`.github/workflows/test-dev-branch.yaml`中添加新文件的验证

## 📝 注意事项

1. **向后兼容性** - 旧的文件路径引用需要更新
2. **文件权限** - 确保测试脚本有执行权限
3. **相对路径** - 所有脚本使用相对路径，便于移植
4. **版本控制** - 建议提交所有更改后再运行测试

这个新的目录结构为项目提供了更清晰的组织方式，便于维护和扩展。
