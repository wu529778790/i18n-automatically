# i18n-automatically

## 介绍

一键扫描整个项目的`中文`替换成`key`，并生成指定的语言包翻译文件。

- 自动检测并替换中文字符串
- 生成唯一的翻译键
- 支持递归处理整个项目目录
- 支持文案回显
- 支持一键生成指定翻译包文件
- 支持语言切换显示

### 扫描中文

扫描当前文件的所有的中文，并替换成`key`，并生成 `zh.json` 文件。

![20240905155251](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905155251.png)

### 批量扫描中文

弹出选择文件夹，扫描所选文件夹的所有的中文，并替换成`key`，并生成 `zh.json` 文件。

### 生成语言包

弹出输入框(默认en),根据 `zh.json` 生成指定语言包文件

![20240905160119](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160119.png)

### 切换语言

替换之后在有`key`的每一行后面会显示对应的中文, 点击切换语言会切换成对应的语言。

读取的是本地文件，比如刚才生成了 `en.json` 就可以切换`en`语言

![20240905160252](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240905160252.png)

## 配置文件

|属性|描述|默认值|
|:--|:--|:--|
|i18nFilePath|指定国际化文件的根目录。| '/src/i18n' |
|templateI18nCall|在 Vue 模板中调用翻译函数的语法。| '$t' |
|scriptI18nCall|在 JavaScript 文件中调用翻译函数的语法。| 'i18n.t' |
|i18nImportPath|自动导入i18n模块的代码。| '@/i18n' |
|keyFilePathLevel|生成的语言包的键中文件路径的层级。| 2 |
|excludedExtensions|在扫描和生成语言包时需要排除的文件扩展名列表。| [".svg", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".md", ".txt", ".json", ".css", ".scss", ".less", ".sass", ".styl"] |
|debug|是否开启调试模式。|  false |
|baidu.appid|百度翻译的应用ID。| - |
|baidu.secretKey|百度翻译的密钥。| - |

### 申请百度翻译

<https://api.fanyi.baidu.com/doc/21>

按照流程申请百度翻译api权限

![20240910201102](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240910201102.png)

然后点击开发者信息, <https://api.fanyi.baidu.com/manage/developer>,复制`appid`和`secretKey`到配置文件中

![20240910201237](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20240910201237.png)

> 提示：这里要选择高级版本。只要实名认证了，都可以高级版本，api没有那么多限制

![20241009144522](https://gcore.jsdelivr.net/gh/wu529778790/image/blog/20241009144522.png)

## 未开发功能

- template解析之后，里面再当成js用babel解析
- 增加其他翻译api，比如deepl，谷歌等

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
