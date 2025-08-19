# i18n-automatically — 一键把中文文案变成可维护的多语言

> 让国际化不再是体力活：一键扫描、自动替换、即时生成语言包，前端项目 10 分钟接入 i18n。

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/wu529778790.i18n-automatically.svg?label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=wu529778790.i18n-automatically)
[![Open VSX](https://img.shields.io/badge/Open%20VSX-i18n--automatically-2ea44f)](https://open-vsx.org/extension/wu529778790/i18n-automatically)

基于 Babel/ Vue 官方编译器解析 AST，自动将中文替换为唯一 key，并把翻译结果写入 `locale/*.json`。内置 Prettier 保持代码风格一致，默认读取你工程根目录的 Prettier 配置。

## 为什么选它

- **开箱即用**：零改造接入；一键扫描当前文件/目录，自动替换中文并写入 `zh.json`。
- **稳定可靠**：基于 AST 的精准替换，兼容 Vue/React/TS/JS 与模板/JSX/字符串字面量等多种场景。
- **体验顺滑**：格式化集成 Prettier，同步更新语言包；编辑器内联回显原文案，方便校对。
- **自动翻译**：内置免费 Google 翻译；可切换百度/DeepL，满足高质量与高配额需求。
- **团队友好**：统一 key 生成规则，可配置忽略词/文件类型，支持 MD5 key 去重，保障多人协作的一致性。

## 安装与上手

- VS Code（推荐）：从 VS Code Marketplace 安装
  - 链接：<https://marketplace.visualstudio.com/items?itemName=wu529778790.i18n-automatically>
  - 命令行：

    ```bash
    code --install-extension wu529778790.i18n-automatically
    ```

- Cursor：从 Open VSX 安装（Cursor 扩展搜索基于 Open VSX）
  - 链接：<https://open-vsx.org/extension/wu529778790/i18n-automatically>
  - 命令行：

    ```bash
    cursor --install-extension wu529778790.i18n-automatically
    ```

  - 也可以在 Cursor 的扩展页直接搜索安装

## 支持的翻译服务

- ✅ 免费谷歌翻译(插件自带)
- ✅ 百度翻译
- ✅ DeepL 翻译

## 结果对比

vue对比图：<https://www.diffchecker.com/WjmYT5g4/>

<!-- ![20241017155847](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241017155847.png)

点击链接查看完整对比图：<https://www.diffchecker.com/WjmYT5g4/> -->

jsx对比图：<https://www.diffchecker.com/bYgP5eUP/>

<!-- ![20241017155908](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241017155908.png)

点击链接查看完整对比图：<https://www.diffchecker.com/bYgP5eUP/> -->

<!-- ![20241017155929](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241017155929.png) -->

ts对比图：<https://www.diffchecker.com/IRWBVjHe/>

<!-- ![20241017155823](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241017155823.png) -->

js对比图：<https://www.diffchecker.com/VyO3Zw6b/>

<!-- ![20241017160240](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241017160240.png) -->

tsx对比图：<https://www.diffchecker.com/OaZLu99x/>

### 扫描中文（当前文件）

一键扫描当前文件中的中文，替换成 key，同时把原文写入 `zh.json`。

![20240905155251](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905155251.png)

### 批量扫描中文（目录）

选择任意目录，递归扫描并替换中文，批量生成/合并到 `zh.json`。

### 生成语言包

从 `zh.json` 一键生成任意语言包（默认 `en`），支持覆盖合并与增量更新。

![20240905160119](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160119.png)

输入框里面填写要翻译成的语言，名称按照翻译对应的。

比如免费谷歌翻译：<https://cloud.google.com/translate/docs/languages?hl=zh-cn>

![20250606185558](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606185558.png)

比如百度翻译：<https://api.fanyi.baidu.com/doc/21>

![20250606112004](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606112004.png)

比如deepL：<https://developers.deepl.com/docs/api-reference/languages>

> 要注意的是deepL这里都是大写

![20250606112349](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606112349.png)

### 切换语言与文案回显

替换后在每行尾部显示当前语言的文案，点击即可在 `zh/en/...` 之间切换，所见即所得地核对翻译。

![20240905160252](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160252.png)

## 可配置且安全的默认值

|属性|描述|默认值|
|:--|:--|:--|
|i18nFilePath|指定国际化文件的根目录。| 'src/i18n' |
|autoImportI18n|是否自动导入i18n模块。| true |
|i18nImportPath|自动导入i18n模块的路径。| '@/i18n' |
|templateI18nCall|在 Vue 模板中调用翻译函数的语法。| '$t' |
|scriptI18nCall|在 JavaScript 文件中调用翻译函数的语法。| 'i18n.global.t' |
|keyFilePathLevel|生成的语言包的键中文件路径的层级。| 2 |
|excludeDebugContexts|是否跳过调试上下文中文（console/throw/assert/debugger）。设为 true 可跳过扫描日志。| false |
|excludedExtensions|排除的文件后缀名|[".svg",".png",".jpg",".jpeg",".gif",".bmp",".ico",".md",".txt",".json",".css",".scss",".less",".sass",".styl"] |
|excludedStrings|排除的字符串| ["宋体","黑体","楷体","仿宋","微软雅黑","华文","方正","苹方","思源","YYYY年MM月DD日"] |
|freeGoogle|默认自带免费谷歌翻译 | true |
|baidu.appid|百度翻译的应用ID。| - |
|baidu.secretKey|百度翻译的密钥。| - |
|deepl.authKey|DeepL 翻译的认证密钥。| - |
|deepl.isPro|是否为 DeepL Pro 版本。| false |
|useMd5Key|使用 MD5 生成 key，相同文本生成相同 key 实现去重。| false |

### Key 生成策略

插件支持两种 key 生成策略：

#### 默认策略（基于组件名）

默认情况下，插件使用组件文件路径和唯一标识符生成 key，格式为：`组件名-文件UUID-序号`

例如：`HomePage-a1b2c3-1`、`UserProfile-d4e5f6-2`

**优势：**

- 不同的语境下翻译可能不一样

#### MD5 策略（基于文本内容）

当设置 `useMd5Key: true` 时，插件会使用中文文本的 MD5 值作为 key。

**优势：**

- **自动去重**：相同的中文文本在不同文件中会生成相同的 key，避免重复翻译
- **一致性**：同一段文案在整个项目中使用统一的 key
- **维护性**：修改文案时不需要手动维护多个 key

**示例：**

```json
{
  "5d41402abc4b2a76b9719d911017c592": "你好世界",
  "098f6bcd4621d373cade4e832627b4f6": "测试文本"
}
```

**推荐场景：**

- 大型项目，有大量重复文案
- 多人协作开发，需要避免重复 key
- 希望简化国际化文件管理

### 默认免费谷歌翻译（网络可用时）

不用使用任何配置，插件自带，直接使用即可。

> 由于你懂的原因，使用免费谷歌翻译要富强

默认的免费谷歌翻译环境取决于你的网络，并不一定稳定。有问题，可以参考下面的链接

免费谷歌翻译依赖于：<https://github.com/vitalets/google-translate-api#readme>

### 申请百度翻译（推荐）

百度翻译自己申请key既免费又稳定，而且量大管饱，高级版免费调用量调整为100万字符/月

<https://api.fanyi.baidu.com/doc/21>

按照流程申请百度翻译api权限

![20240910201102](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240910201102.png)

然后点击开发者信息, <https://api.fanyi.baidu.com/manage/developer>,复制`appid`和`secretKey`到配置文件中

![20240910201237](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240910201237.png)

> 提示：这里要选择高级版本。只要实名认证了，都可以高级版本，api没有那么多限制

![20241009144522](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241009144522.png)

### 申请 DeepL 翻译

<https://www.deepl.com/zh/pro-api>

1. 注册 DeepL 账户并获取 API 密钥
2. 可以选择免费版本（每月50万字符）或专业版本
3. 将 `authKey` 复制到配置文件中
4. 如果使用专业版本，请将 `isPro` 设置为 `true`

DeepL 翻译服务具有更高的翻译质量，支持多种语言，适合对翻译质量有较高要求的项目。

## 参与开发

<https://github.com/wu529778790/i18n-automatically>

安装依赖

```bash
yarn
```

F5 启动, 调试

下载打包依赖

```bash
yarn add @vscode/vsce -g
```

打包

```bash
vsce package --yarn
```
