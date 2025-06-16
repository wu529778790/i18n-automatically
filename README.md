# i18n-automatically

使用babel解析成AST，替换中文为指定的key之后，在还原。

采用prettier格式化代码。默认读取项目根目录的prettier配置文件(`.prettierrc.js`)。

## 介绍

一键扫描整个项目的`中文`替换成`key`，并生成指定的语言包翻译文件。

- 自动检测并替换中文字符串
- 生成唯一的翻译键
- 支持递归处理整个项目目录
- 支持文案回显
- 支持一键生成指定翻译包文件
- 支持语言切换显示
- 自带免费谷歌翻译，无需配置token

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

### 扫描中文

扫描当前文件的所有的中文，并替换成`key`，并生成 `zh.json` 文件。

![20240905155251](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905155251.png)

### 批量扫描中文

弹出选择文件夹，扫描所选文件夹的所有的中文，并替换成`key`，并生成 `zh.json` 文件。

### 生成语言包

弹出输入框(默认en),根据 `zh.json` 生成指定语言包文件

![20240905160119](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160119.png)

输入框里面填写要翻译成的语言，名称按照翻译对应的。

比如免费谷歌翻译：<https://cloud.google.com/translate/docs/languages?hl=zh-cn>

![20250606185558](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606185558.png)

比如百度翻译：<https://api.fanyi.baidu.com/doc/21>

![20250606112004](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606112004.png)

比如deepL：<https://developers.deepl.com/docs/api-reference/languages>

> 要注意的是deepL这里都是大写

![20250606112349](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20250606112349.png)

### 切换语言

替换之后在有`key`的每一行后面会显示对应的中文, 点击切换语言会切换成对应的语言。

读取的是本地文件，比如刚才生成了 `en.json` 就可以切换`en`语言

![20240905160252](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160252.png)

## 配置文件

|属性|描述|默认值|
|:--|:--|:--|
|i18nFilePath|指定国际化文件的根目录。| '/src/i18n' |
|autoImportI18n|是否自动导入i18n模块。| true |
|i18nImportPath|自动导入i18n模块的路径。| '@/i18n' |
|templateI18nCall|在 Vue 模板中调用翻译函数的语法。| '$t' |
|scriptI18nCall|在 JavaScript 文件中调用翻译函数的语法。| 'i18n.global.t' |
|keyFilePathLevel|生成的语言包的键中文件路径的层级。| 2 |
|excludedExtensions|排除的文件后缀名|[".svg",".png",".jpg",".jpeg",".gif",".bmp",".ico",".md",".txt",".json",".css",".scss",".less",".sass",".styl"] |
|excludedStrings|排除的字符串| ["宋体","黑体","楷体","仿宋","微软雅黑","华文","方正","苹方","思源","YYYY年MM月DD日"] |
|debug|是否开启调试模式。|  false |
|freeGoogle|默认自带免费谷歌翻译 | true |
|baidu.appid|百度翻译的应用ID。| - |
|baidu.secretKey|百度翻译的密钥。| - |
|deepl.authKey|DeepL 翻译的认证密钥。| - |
|deepl.isPro|是否为 DeepL Pro 版本。| false |

### 默认免费谷歌翻译(看自己网络)

不用使用任何配置，插件自带，直接使用即可。

> 由于你懂的原因，使用免费谷歌翻译要富强

默认的免费谷歌翻译环境取决于你的网络，并不一定稳定。有问题，可以参考下面的链接

免费谷歌翻译依赖于：<https://github.com/vitalets/google-translate-api#readme>

### 申请百度翻译(推荐)

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

## 开发

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
