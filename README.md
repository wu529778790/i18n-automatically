# i18n-automatically

## 介绍

一键扫描整个项目的`中文`替换成`key`，并生成指定的语言包翻译文件。

- 支持文案回显
- 支持一键扫描中文
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
|autoImportI18n|自动导入i18n模块的代码。| 'import i18n from '@/i18n';' |
|keyFilePathLevel|生成的语言包的键中文件路径的层级。| 2 |
|excludedExtensions|在扫描和生成语言包时需要排除的文件扩展名列表。| [".svg", ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".md", ".txt", ".json", ".css", ".scss", ".less", ".sass", ".styl"] |
|debug|是否开启调试模式。|  false |
|baidu.appid|百度翻译的应用ID。|  '20240816002125202' |
|baidu.secretKey|百度翻译的密钥。| 'RgsItLMSJR3AACzwBwc6' |

```json
{
  // i18n根目录
  "i18nFilePath": "/src/i18n",
  // vue的template标签内的语法
  "templateI18nCall": "$t",
  // js语法
  "scriptI18nCall": "i18n.t",
  // 自动导入i18n的代码
  "autoImportI18n": "import i18n from '@/i18n';",
  // 生成的语言包的key中filepath的层级
  "keyFilePathLevel": 2,
  // 排除文件的后缀名
  "excludedExtensions": [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".ico",
    ".md",
    ".txt",
    ".json",
    ".css",
    ".scss",
    ".less",
    ".sass",
    ".styl"
  ],
  // 是否开启debug模式
  "debug": false,
  // 百度翻译的appid和secretKey
  "baidu": {
    "appid": "20240816002125202",
    "secretKey": "RgsItLMSJR3AACzwBwc6"
  }
}
```
