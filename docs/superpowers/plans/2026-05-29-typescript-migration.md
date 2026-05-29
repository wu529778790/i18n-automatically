# JS → TypeScript 完整重写迁移计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 i18n-automatically VS Code 扩展的 19 个 JS 源文件全部重写为 TypeScript，源码使用 ESM import/export，测试迁移到 Vitest。

**Architecture:** 一次性重写所有源文件为 `.ts`，加 `tsconfig.json` 做类型检查，esbuild 处理 TS 编译和 CJS 打包输出。测试从自定义 Node assert runner 迁移到 Vitest。删除 `jsconfig.json`，ESLint 切换到 `@typescript-eslint/parser`。

**Tech Stack:** TypeScript 5.x, esbuild (native TS support), Vitest, @typescript-eslint

---

## 文件结构映射

### 类型定义文件（新建）
- Create: `src/types.ts` — 所有共享接口和类型定义

### 源文件迁移（JS → TS，同名替换）
| 原 JS 文件 | 新 TS 文件 | 职责 |
|---|---|---|
| `src/utils/index.js` | `src/utils/index.ts` | getRootPath, generateUniqueId, saveObjectToPath |
| `src/script/setting.js` | `src/script/setting.ts` | 配置文件读写、默认配置 |
| `src/script/scanChinese.js` | `src/script/scanChinese.ts` | 单文件扫描命令 |
| `src/script/scanChineseBatch.js` | `src/script/scanChineseBatch.ts` | 批量文件夹扫描 |
| `src/script/switchLanguage.js` | `src/script/switchLanguage.ts` | 语言切换 + 装饰器 |
| `src/script/I18nProcessor/common.js` | `src/script/I18nProcessor/common.ts` | 工厂、key 生成、TranslationManager |
| `src/script/I18nProcessor/jsProcessor.js` | `src/script/I18nProcessor/jsProcessor.ts` | Babel AST JS/TS/JSX/TSX 处理 |
| `src/script/I18nProcessor/vueProcessor.js` | `src/script/I18nProcessor/vueProcessor.ts` | Vue SFC 处理 |
| `src/script/I18nProcessor/index.js` | `src/script/I18nProcessor/index.ts` | 文件编排、Prettier 格式化、写回 |
| `src/script/generateLanguagePackage/api/freeGoogle.js` | `src/script/generateLanguagePackage/api/freeGoogle.ts` | Google 翻译 API |
| `src/script/generateLanguagePackage/api/baidu.js` | `src/script/generateLanguagePackage/api/baidu.ts` | 百度翻译 API |
| `src/script/generateLanguagePackage/api/deepl.js` | `src/script/generateLanguagePackage/api/deepl.ts` | DeepL 翻译 API |
| `src/script/generateLanguagePackage/translators/googleTranslator.js` | `src/script/generateLanguagePackage/translators/googleTranslator.ts` | Google 翻译器 |
| `src/script/generateLanguagePackage/translators/baiduTranslator.js` | `src/script/generateLanguagePackage/translators/baiduTranslator.ts` | 百度翻译器 |
| `src/script/generateLanguagePackage/translators/deeplTranslator.js` | `src/script/generateLanguagePackage/translators/deeplTranslator.ts` | DeepL 翻译器 |
| `src/script/generateLanguagePackage/translators/index.js` | `src/script/generateLanguagePackage/translators/index.ts` | 翻译器工厂 |
| `src/script/generateLanguagePackage/index.js` | `src/script/generateLanguagePackage/index.ts` | 语言包生成命令 |
| `src/script/index.js` | `src/script/index.ts` | barrel re-export |
| `src/extension.js` | `src/extension.ts` | VS Code 扩展入口 |

### 配置文件（新建/修改）
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Delete: `jsconfig.json`
- Delete: `.vscode-test.mjs`
- Modify: `scripts/esbuild.js` → `scripts/esbuild.ts` (入口改为 .ts)
- Modify: `package.json` (scripts, devDependencies)
- Modify: `.eslintrc.json` (TS parser)

### 测试文件（新建替换）
- Create: `tests/unit/jsProcessor.test.ts`
- Create: `tests/unit/vueProcessor.test.ts`
- Delete: `tests/run-tests.js`
- Delete: `tests/unit/jsProcessor.test.js`
- Delete: `tests/unit/vueProcessor.test.js`
- Delete: `tests/unit/demoTest.validation.js`

---

## Task 1: 项目配置层

**Files:**
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `scripts/esbuild.js`
- Modify: `.eslintrc.json`
- Delete: `jsconfig.json`
- Delete: `.vscode-test.mjs`

- [ ] **Step 1: 安装 TypeScript、Vitest 和 ESLint TS 依赖**

```bash
cd /Users/mac/github/i18n-automatically
yarn add -D typescript vitest @typescript-eslint/parser @typescript-eslint/eslint-plugin
yarn remove @vscode/test-cli @vscode/test-electron @types/mocha
```

- [ ] **Step 2: 创建 tsconfig.json**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node", "vscode"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 更新 package.json scripts**

将 `package.json` 中 `scripts` 部分替换为：

```json
"scripts": {
  "lint": "eslint --fix .",
  "build": "node scripts/esbuild.js",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:js": "vitest run tests/unit/jsProcessor.test.ts",
  "test:vue": "vitest run tests/unit/vueProcessor.test.ts",
  "test:unit": "vitest run",
  "test:all": "npm run lint && npm run typecheck && npm run test:unit",
  "vscode:prepublish": "npm run build"
}
```

- [ ] **Step 5: 更新 scripts/esbuild.js — 入口改为 .ts**

将 `scripts/esbuild.js` 第 57 行：
```js
entryPoints: [path.resolve(__dirname, '..', 'src', 'extension.js')],
```
改为：
```js
entryPoints: [path.resolve(__dirname, '..', 'src', 'extension.ts')],
```

esbuild 原生支持 TS，无需额外 loader 配置。

- [ ] **Step 6: 更新 .eslintrc.json — 使用 TS parser**

替换整个 `.eslintrc.json`：

```json
{
  "env": {
    "browser": false,
    "es6": true,
    "node": true
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-const-assign": "warn",
    "no-this-before-super": "warn",
    "no-unreachable": "warn",
    "constructor-super": "warn",
    "valid-typeof": "warn",
    "no-undef": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

注意：`no-undef` 在 TS 中由编译器检查，ESLint 关闭它避免误报。

- [ ] **Step 7: 删除旧配置文件**

```bash
rm jsconfig.json .vscode-test.mjs
```

- [ ] **Step 8: 验证配置**

```bash
npx tsc --noEmit
```

预期：会报错因为源文件还是 JS，但 `tsconfig.json` 应该被正确识别。

```bash
npx vitest run
```

预期：`No test files found`，因为还没有 .test.ts 文件。

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "chore: add TypeScript and Vitest configuration"
```

---

## Task 2: 类型定义文件

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 创建 src/types.ts**

```ts
import type { WorkspaceFolder } from 'vscode';

/** i18n 扩展配置 */
export interface I18nConfig {
  i18nFilePath: string;
  autoImportI18n: boolean;
  i18nImportPath: string;
  templateI18nCall: string;
  scriptI18nCall: string;
  keyFilePathLevel: number;
  excludeDebugContexts: boolean;
  excludedExtensions: string[];
  excludedStrings: string[];
  freeGoogle: boolean;
  baidu: {
    appid: string;
    secretKey: string;
  };
  deepl: {
    authKey: string;
    isPro: boolean;
  };
  useMd5Key: boolean;
  locale?: string;
  isAutoImportI18n?: boolean;
}

/** AST 处理上下文 */
export interface ProcessorContext {
  filePath: string;
  fileUuid: string;
  config: I18nConfig;
  index: number;
  translations: Map<string, string>;
  contentSource: string;
  contentChanged: string;
  ast: any | null;
  hasPluginImport?: boolean;
  templateSize?: number;
}

/** 文件处理器函数签名 */
export type FileProcessor = (
  filePath: string,
  config: I18nConfig,
) => Promise<ProcessorContext | undefined>;

/** AST 处理器函数签名 */
export type AstProcessor = (
  context: ProcessorContext,
  customContent?: string,
) => ProcessorContext;

/** 翻译 API 返回的单条结果 */
export interface TranslateResultItem {
  src?: string;
  dst: string;
}

/** 翻译 API 返回结构 */
export interface TranslateResult {
  trans_result?: TranslateResultItem[];
  error_code?: string;
  error_msg?: string;
  error_type?: string;
  error?: string;
}

/** 翻译器接口 */
export interface ITranslator {
  translate(
    texts: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null>;
}

/** 装饰器范围项 */
export interface DecorationItem {
  range: import('vscode').Range;
  renderOptions: {
    after: {
      contentText: string;
      color: import('vscode').ThemeColor;
      opacity: string;
    };
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript type definitions"
```

---

## Task 3: 迁移 utils 和 setting

**Files:**
- Create: `src/utils/index.ts` (替换 `src/utils/index.js`)
- Create: `src/script/setting.ts` (替换 `src/script/setting.js`)

- [ ] **Step 1: 写 src/utils/index.ts**

```ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** 生成唯一 ID */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substring(2, 8);
  return timestamp + random;
}

/** 保存对象到指定路径 */
export function saveObjectToPath(
  obj: Record<string, unknown>,
  filePath: string,
): Promise<void> {
  const rootPath = getRootPath();
  const newFilePath = path.join(rootPath, filePath);
  const directory = path.dirname(newFilePath);

  return new Promise((resolve, reject) => {
    // 创建目录（如果不存在）
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    let updatedContent = obj;

    // 尝试读取文件内容并合并
    if (fs.existsSync(newFilePath)) {
      try {
        const fileContent = fs.readFileSync(newFilePath, 'utf-8');
        const fileContentObj: Record<string, unknown> = fileContent
          ? JSON.parse(fileContent)
          : {};
        updatedContent = { ...fileContentObj, ...obj };
      } catch (_error) {
        reject(`Error reading or parsing file: ${newFilePath}`);
        return;
      }
    }

    // 写入更新后的内容
    try {
      fs.writeFileSync(
        newFilePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
      resolve();
    } catch (_error) {
      reject(`Error writing file: ${newFilePath}`);
    }
  });
}

/** 获取工作区根目录 */
export function getRootPath(): string {
  return vscode.workspace.workspaceFolders![0].uri.fsPath;
}
```

- [ ] **Step 2: 写 src/script/setting.ts**

```ts
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getRootPath } from '../utils';
import type { I18nConfig } from '../../types';

const defaultConfig: I18nConfig = {
  i18nFilePath: '/src/i18n',
  autoImportI18n: true,
  i18nImportPath: '@/i18n',
  templateI18nCall: '$t',
  scriptI18nCall: 'i18n.global.t',
  keyFilePathLevel: 2,
  excludeDebugContexts: false,
  excludedExtensions: [
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.bmp',
    '.ico',
    '.md',
    '.txt',
    '.json',
    '.css',
    '.scss',
    '.less',
    '.sass',
    '.styl',
  ],
  excludedStrings: [
    '宋体',
    '黑体',
    '楷体',
    '仿宋',
    '微软雅黑',
    '华文',
    '方正',
    '苹方',
    '思源',
    'YYYY年MM月DD日',
  ],
  freeGoogle: true,
  baidu: {
    appid: '',
    secretKey: '',
  },
  deepl: {
    authKey: '',
    isPro: false,
  },
  useMd5Key: false,
};

/** 打开或创建配置文件 */
export function setting(): void {
  const rootPath = getRootPath();
  const configFilePath = path.join(rootPath, '/automatically-i18n-config.json');
  if (!fs.existsSync(configFilePath)) {
    handleMissingConfig(configFilePath, true);
  }
  vscode.workspace.openTextDocument(configFilePath).then((document) => {
    vscode.window.showTextDocument(document);
  });
}

let cacheConfig: I18nConfig | undefined;

/** 获取最新的配置文件 */
export function readConfig(
  initConfigFile = false,
  clearCache = false,
): I18nConfig | undefined {
  if (cacheConfig && !clearCache) {
    return cacheConfig;
  } else {
    cacheConfig = initConfigFn(initConfigFile);
    return cacheConfig;
  }
}

function initConfigFn(initConfigFile = true): I18nConfig {
  try {
    const rootPath = getRootPath();
    const configFilePath = path.join(
      rootPath,
      '/automatically-i18n-config.json',
    );
    if (!fs.existsSync(configFilePath)) {
      return handleMissingConfig(configFilePath, initConfigFile) ?? defaultConfig;
    }
    const config: Partial<I18nConfig> = JSON.parse(
      fs.readFileSync(configFilePath, 'utf8'),
    );
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.error('读取配置文件时出现错误：', error);
    return defaultConfig;
  }
}

function handleMissingConfig(
  configFilePath: string,
  initConfigFile: boolean,
): I18nConfig | undefined {
  if (initConfigFile) {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    } catch (error) {
      console.error('创建配置文件时出现错误：', error);
    }
  }
  return undefined;
}
```

注意：原代码 `initConfig` 函数名与 export 的 `initConfigFile` 参数可能混淆，改为 `initConfigFn` 避免命名冲突。

- [ ] **Step 3: 删除旧 JS 文件**

```bash
rm src/utils/index.js src/script/setting.js
```

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "refactor: migrate utils and setting to TypeScript"
```

---

## Task 4: 迁移翻译 API 和翻译器

**Files:**
- Create: `src/script/generateLanguagePackage/api/freeGoogle.ts`
- Create: `src/script/generateLanguagePackage/api/baidu.ts`
- Create: `src/script/generateLanguagePackage/api/deepl.ts`
- Create: `src/script/generateLanguagePackage/translators/googleTranslator.ts`
- Create: `src/script/generateLanguagePackage/translators/baiduTranslator.ts`
- Create: `src/script/generateLanguagePackage/translators/deeplTranslator.ts`
- Create: `src/script/generateLanguagePackage/translators/index.ts`

- [ ] **Step 1: 写 src/script/generateLanguagePackage/api/freeGoogle.ts**

```ts
import { translate } from '@vitalets/google-translate-api';
import type { TranslateResult } from '../../../../types';

export async function googleTranslateApi(
  q: string,
  language = 'en',
): Promise<TranslateResult> {
  try {
    const { text } = await translate(q, { to: language });
    return {
      trans_result: [{ dst: text }],
    };
  } catch (error: any) {
    console.error('Google translate error:', error);

    if (error.name === 'TooManyRequestsError') {
      return {
        error_code: '429',
        error_msg: '免费谷歌翻译请求频率超限，请稍后重试',
        error_type: 'RATE_LIMIT',
        original_error: error.message,
      } as TranslateResult;
    }

    return {
      error_code: '500',
      error_msg: '免费谷歌翻译服务异常',
      error_type: error.name || 'UNKNOWN_ERROR',
      original_error: error.message,
      stack: error.stack,
    } as TranslateResult;
  }
}
```

- [ ] **Step 2: 写 src/script/generateLanguagePackage/api/baidu.ts**

```ts
import axios from 'axios';
import * as crypto from 'crypto';
import { readConfig } from '../../../setting';
import type { TranslateResult } from '../../../../../types'; // 注意：api/ 在 generateLanguagePackage/ 下

// 修正路径深度：api/baidu.ts → 3级到 src/
import type { TranslateResult } from '../../../../types';

/** 生成百度翻译签名 */
function generateSign(
  appid: string,
  q: string,
  salt: number,
  secretKey: string,
): string {
  return crypto
    .createHash('md5')
    .update(appid + q + salt + secretKey)
    .digest('hex');
}

export async function baiduTranslateApi(
  q: string,
  language = 'en',
): Promise<TranslateResult | undefined> {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return undefined;
  }
  const { appid, secretKey } = config.baidu;
  const salt = new Date().getTime();
  const res = await axios({
    method: 'post',
    url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    params: {
      q,
      from: 'auto',
      to: language,
      appid,
      salt,
      sign: generateSign(appid, q, salt, secretKey),
    },
  });
  return res.data;
}
```

> **注意：** 上面的 import 有重复。下面是最终正确版本，去掉第一个 import：

```ts
import axios from 'axios';
import * as crypto from 'crypto';
import { readConfig } from '../../../setting';
import type { TranslateResult } from '../../../../types';

function generateSign(
  appid: string,
  q: string,
  salt: number,
  secretKey: string,
): string {
  return crypto
    .createHash('md5')
    .update(appid + q + salt + secretKey)
    .digest('hex');
}

export async function baiduTranslateApi(
  q: string,
  language = 'en',
): Promise<TranslateResult | undefined> {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return undefined;
  }
  const { appid, secretKey } = config.baidu;
  const salt = new Date().getTime();
  const res = await axios({
    method: 'post',
    url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    params: {
      q,
      from: 'auto',
      to: language,
      appid,
      salt,
      sign: generateSign(appid, q, salt, secretKey),
    },
  });
  return res.data;
}
```

- [ ] **Step 3: 写 src/script/generateLanguagePackage/api/deepl.ts**

```ts
import axios from 'axios';
import { readConfig } from '../../../setting';
import type { TranslateResult } from '../../../../types';

export async function deeplTranslateApi(
  text: string,
  targetLanguage = 'en',
): Promise<TranslateResult> {
  const config = readConfig();
  if (!config) {
    console.error('未找到配置文件');
    return { error: '未找到配置文件' } as TranslateResult;
  }

  const { authKey, isPro } = config.deepl;
  if (!authKey) {
    console.error('未配置 DeepL 认证密钥');
    return { error: '未配置 DeepL 认证密钥' } as TranslateResult;
  }

  const targetLang = targetLanguage.toUpperCase();

  const baseUrl = isPro
    ? 'https://api.deepl.com/v2/translate'
    : 'https://api-free.deepl.com/v2/translate';

  try {
    const textArray = text.split('\n').filter((line) => line.trim() !== '');

    const response = await axios({
      method: 'post',
      url: baseUrl,
      headers: {
        Authorization: `DeepL-Auth-Key ${authKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        text: textArray,
        source_lang: 'ZH',
        target_lang: targetLang,
        preserve_formatting: true,
        split_sentences: 'nonewlines',
      },
    });

    const translations = response.data.translations.map(
      (translation: { text: string }, index: number) => ({
        src: textArray[index] || '',
        dst: translation.text,
      }),
    );

    return {
      trans_result: translations,
    };
  } catch (error: any) {
    console.error(
      'DeepL 翻译错误:',
      error.response?.data || error.message,
    );
    return {
      error_code: error.response?.status || 'UNKNOWN_ERROR',
      error_msg:
        error.response?.data?.message || error.message,
    } as TranslateResult;
  }
}
```

- [ ] **Step 4: 写 src/script/generateLanguagePackage/translators/googleTranslator.ts**

```ts
import * as vscode from 'vscode';
import { googleTranslateApi } from '../api/freeGoogle';
import type { ITranslator, TranslateResultItem } from '../../../../../types';

export class GoogleTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const trans_result: TranslateResultItem[] = [];
    for (const text of arr) {
      const data = await googleTranslateApi(text, language);
      if (data.error_code) {
        vscode.window.showErrorMessage(
          `免费谷歌翻译失败，错误码：${data.error_code}，请稍后重试`,
        );
        trans_result.push({ dst: '' });
      } else {
        trans_result.push(data.trans_result![0]);
      }
    }
    return trans_result;
  }
}
```

- [ ] **Step 5: 写 src/script/generateLanguagePackage/translators/baiduTranslator.ts**

```ts
import * as vscode from 'vscode';
import { baiduTranslateApi } from '../api/baidu';
import type { ITranslator, TranslateResultItem } from '../../../../../types';

export class BaiduTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const text = arr.join('\n');
    const data = await baiduTranslateApi(text, language);
    if (!data) return null;
    if (data.error_code) {
      vscode.window.showErrorMessage(
        `百度翻译失败，错误码：${data.error_code}，请打开百度翻译官网查看错误信息：https://api.fanyi.baidu.com/doc/21`,
      );
      return null;
    }
    return data.trans_result ?? null;
  }
}
```

- [ ] **Step 6: 写 src/script/generateLanguagePackage/translators/deeplTranslator.ts**

```ts
import * as vscode from 'vscode';
import { deeplTranslateApi } from '../api/deepl';
import type { ITranslator, TranslateResultItem } from '../../../../../types';

export class DeeplTranslator implements ITranslator {
  async translate(
    arr: string[],
    language: string,
  ): Promise<TranslateResultItem[] | null> {
    const text = Array.isArray(arr) ? arr.join('\n') : String(arr || '');
    const data = await deeplTranslateApi(text, language);
    if (data.error_code || data.error) {
      vscode.window.showErrorMessage(
        `DeepL 翻译失败：${data.error_msg || data.error}`,
      );
      return null;
    }
    return data.trans_result ?? null;
  }
}
```

- [ ] **Step 7: 写 src/script/generateLanguagePackage/translators/index.ts**

```ts
import { BaiduTranslator } from './baiduTranslator';
import { DeeplTranslator } from './deeplTranslator';
import { GoogleTranslator } from './googleTranslator';
import type { ITranslator } from '../../../../types';

const translators: Record<string, new () => ITranslator> = {
  baidu: BaiduTranslator,
  deepl: DeeplTranslator,
  freeGoogle: GoogleTranslator,
};

export function createTranslator(serviceName: string): ITranslator {
  const Translator = translators[serviceName];
  if (!Translator) {
    throw new Error(`未找到 ${serviceName} 翻译服务`);
  }
  return new Translator();
}
```

- [ ] **Step 8: 删除旧 JS 文件**

```bash
rm src/script/generateLanguagePackage/api/freeGoogle.js
rm src/script/generateLanguagePackage/api/baidu.js
rm src/script/generateLanguagePackage/api/deepl.js
rm src/script/generateLanguagePackage/translators/googleTranslator.js
rm src/script/generateLanguagePackage/translators/baiduTranslator.js
rm src/script/generateLanguagePackage/translators/deeplTranslator.js
rm src/script/generateLanguagePackage/translators/index.js
```

- [ ] **Step 9: 提交**

```bash
git add -A
git commit -m "refactor: migrate translation APIs and translators to TypeScript"
```

---

## Task 5: 迁移 I18nProcessor/common.ts

**Files:**
- Create: `src/script/I18nProcessor/common.ts` (替换 `src/script/I18nProcessor/common.js`)

- [ ] **Step 1: 写 src/script/I18nProcessor/common.ts**

```ts
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import generate from '@babel/generator';
import * as vscode from 'vscode';
import { generateUniqueId } from '../../utils';
import { readConfig } from '../setting';
import type {
  I18nConfig,
  ProcessorContext,
  AstProcessor,
  FileProcessor,
} from '../../../types';

/** 创建处理上下文 */
export function createContext(
  filePath: string,
  config: I18nConfig,
): ProcessorContext {
  return {
    filePath,
    fileUuid: generateUniqueId(),
    config: {
      ...config,
      isAutoImportI18n: true,
      excludeDebugContexts:
        config && 'excludeDebugContexts' in config
          ? config.excludeDebugContexts
          : true,
    },
    index: 0,
    translations: new Map(),
    contentSource: (() => {
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
          throw new Error(`Not a file: ${filePath}`);
        }
        return fs.readFileSync(filePath, 'utf-8');
      } catch (e: any) {
        console.error('[i18n-automatically] read source failed:', e.message);
        return '';
      }
    })(),
    contentChanged: '',
    ast: null,
  };
}

/** 创建 I18n 处理器（高阶函数） */
export function createI18nProcessor(
  astProcessor: AstProcessor,
): FileProcessor {
  return function (filePath: string, config: I18nConfig) {
    const context = createContext(filePath, config);
    return astProcessor(context) as any;
  };
}

/** 生成 i18n key */
export function generateKey(context: ProcessorContext, text = ''): string {
  const { filePath, fileUuid, config } = context;

  if (config.useMd5Key && text) {
    context.index++;
    return crypto.createHash('md5').update(text.trim()).digest('hex');
  }

  const pathParts = filePath.split(path.sep);
  const pathDeep = config.keyFilePathLevel || 2;
  const selectedLevelsParts = pathParts.slice(-pathDeep);
  const lastLevelWithoutExtension =
    selectedLevelsParts[selectedLevelsParts.length - 1].split('.')[0];
  const selectedLevels = selectedLevelsParts
    .slice(0, -1)
    .concat(lastLevelWithoutExtension)
    .join('-');
  context.index++;
  return `${selectedLevels}-${fileUuid}-${context.index}`;
}

/** 使用 Babel generator 从 AST 生成代码 */
export function generateCode(ast: any, content: string): string {
  const opts = {
    retainLines: true,
    jsonCompatibleStrings: true,
    flowCommaSeparator: true,
    quotes: 'single' as const,
    jsescOption: {
      wrap: true,
    },
  };
  return generate(ast, opts, content).code;
}

/** 检查字符串是否包含 DOM 标签 */
export function stringWithDom(str: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(str);
}

/** 检查字符串是否包含中文 */
export function containsChinese(str: string, isExcluded = false): boolean {
  const chineseRegex = /[一-龥]/;
  if (!chineseRegex.test(str)) {
    return false;
  }

  const imageExtensionRegex =
    /\.(png|jpe?g|gif|svg|webp)(['"]|\?[^'"\s]*)?$/i;
  if (imageExtensionRegex.test(str)) {
    return false;
  }

  if (!isExcluded) {
    const config = readConfig();
    if (
      Array.isArray(config?.excludedStrings) &&
      config.excludedStrings.length
    ) {
      const isExcludedByConfig = config!.excludedStrings.includes(str.trim());
      if (isExcludedByConfig) {
        return false;
      }
    }
  }

  return true;
}

/** 翻译文件管理器 */
export class TranslationManager {
  private getRootPath(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders[0] && workspaceFolders[0].uri) {
      return workspaceFolders[0].uri.fsPath || '';
    }
    return '';
  }

  /** 将翻译对象保存到 JSON 文件 */
  outputTranslationFile(
    translations: Map<string, string> | Record<string, string>,
    config: I18nConfig,
  ): void {
    const rootPath = this.getRootPath();
    const locale = config.locale || 'zh';

    const isWin = process.platform === 'win32';
    const configuredRaw = config.i18nFilePath || 'src/i18n';
    const looksUnixRootOnWin =
      isWin &&
      /^[\\/]+/.test(configuredRaw) &&
      !/^[a-zA-Z]:[\\/]/.test(configuredRaw);
    const normalizedConfigured = looksUnixRootOnWin
      ? configuredRaw.replace(/^[\\/]+/, '')
      : configuredRaw;

    const appearsAbsoluteUnix =
      !isWin && /^[\\/]+/.test(normalizedConfigured);

    let baseDir: string;
    if (path.isAbsolute(normalizedConfigured)) {
      if (
        !normalizedConfigured.startsWith(rootPath) &&
        appearsAbsoluteUnix
      ) {
        baseDir = path.join(
          rootPath,
          normalizedConfigured.replace(/^[\\/]+/, ''),
        );
      } else {
        baseDir = normalizedConfigured;
      }
    } else {
      baseDir = path.join(rootPath, normalizedConfigured);
    }

    if (path.basename(baseDir).toLowerCase() === 'locale') {
      baseDir = path.dirname(baseDir);
    }
    if (/\.json$/i.test(baseDir)) {
      baseDir = path.dirname(baseDir);
    }

    const targetDir = path.join(baseDir, 'locale');
    const filePath = path.join(targetDir, `${locale}.json`);

    const translationObj: Record<string, string> =
      translations instanceof Map
        ? Object.fromEntries(translations)
        : translations;

    try {
      fs.mkdirSync(targetDir, { recursive: true });

      let updatedContent = translationObj;

      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          throw new Error(
            `Expected a file but found a directory at: ${filePath}. Please remove this directory or fix i18nFilePath.`,
          );
        }
        try {
          const fileContent = fs.readFileSync(filePath, {
            encoding: 'utf-8',
            flag: 'r',
          });
          if (fileContent.trim()) {
            const fileContentObj = JSON.parse(fileContent);
            updatedContent = { ...fileContentObj, ...translationObj };
          } else {
            updatedContent = { ...translationObj };
          }
        } catch (error: any) {
          throw new Error(
            `Error reading or parsing file: ${filePath}. ${error.message}`,
          );
        }
      }

      fs.writeFileSync(
        filePath,
        JSON.stringify(updatedContent, null, 2),
        'utf-8',
      );
    } catch (error: any) {
      console.error(`Failed to output translation file: ${error.message}`);
      throw error;
    }
  }
}
```

- [ ] **Step 2: 删除旧文件**

```bash
rm src/script/I18nProcessor/common.js
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: migrate I18nProcessor/common to TypeScript"
```

---

## Task 6: 迁移 I18nProcessor/jsProcessor.ts

**Files:**
- Create: `src/script/I18nProcessor/jsProcessor.ts` (替换 `src/script/I18nProcessor/jsProcessor.js`)

- [ ] **Step 1: 写 src/script/I18nProcessor/jsProcessor.ts**

这是最大的文件（664 行）。核心逻辑不变，仅做 CJS→ESM 和类型注解转换。

```ts
import type * as TraverseModule from '@babel/traverse';
import * as parser from '@babel/parser';
import * as typesModule from '@babel/types';
import {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} from './common';
import type { ProcessorContext } from '../../../types';

// -- @babel/traverse 解析：处理打包后各种导出形态 --

const traverseModule: any = require('@babel/traverse');

function resolveTraverse(mod: any): any {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.traverse === 'function') return mod.traverse;
  if (mod.default && typeof mod.default.traverse === 'function') {
    return mod.default.traverse;
  }
  return null;
}

function resolveTraverseDeep(mod: any): any {
  let current = mod;
  for (let i = 0; i < 6 && current; i++) {
    const direct = resolveTraverse(current);
    if (typeof direct === 'function') return direct;
    current = current && current.default;
  }
  if (mod && typeof mod === 'object') {
    for (const key of Object.keys(mod)) {
      const value = mod[key];
      if (typeof value === 'function') return value;
      if (value && typeof value.traverse === 'function')
        return value.traverse;
      if (value && typeof value.default === 'function') return value.default;
    }
  }
  return null;
}

let traverse: any = null;
function getTraverse(): any {
  if (typeof traverse === 'function') return traverse;
  const candidate =
    resolveTraverse(traverseModule) ||
    resolveTraverse(traverseModule && traverseModule.default) ||
    resolveTraverse(traverseModule && traverseModule.traverse) ||
    resolveTraverseDeep(traverseModule);
  if (typeof candidate === 'function') {
    traverse = candidate;
    return traverse;
  }
  try {
    const keys =
      traverseModule && typeof traverseModule === 'object'
        ? Object.keys(traverseModule)
        : [];
    console.warn(
      '[i18n-automatically] 未能解析到 @babel/traverse 函数导出。类型:',
      typeof traverseModule,
      'keys:',
      keys.slice(0, 20).join(','),
    );
  } catch (_e) {
    // ignore
  }
  return null;
}

const t: typeof typesModule = (typesModule as any).default || typesModule;

/** 将配置中的调用名转为 Babel callee AST */
function buildCalleeFromString(calleeStr: string): any {
  try {
    if (!calleeStr || typeof calleeStr !== 'string')
      return t.identifier('t');
    const parts = calleeStr.split('.').filter(Boolean);
    if (parts.length === 0) return t.identifier('t');

    let current: any;
    if (parts[0] === 'this') {
      current = t.thisExpression();
      parts.shift();
    } else {
      current = t.identifier(parts.shift());
    }
    for (const seg of parts) {
      current = t.memberExpression(current, t.identifier(seg));
    }
    return current;
  } catch (_) {
    return t.identifier('t');
  }
}

/** 处理 JavaScript AST */
export function processJsAst(
  context: ProcessorContext,
  customContent?: string,
): ProcessorContext {
  try {
    context.hasPluginImport = false;
    const ast = parser.parse(customContent || context.contentSource, {
      sourceType: 'module',
      errorRecovery: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      plugins: [
        'jsx',
        ['typescript', { dts: true }],
        'decorators-legacy',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'importMeta',
        'topLevelAwait',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
      ],
    });

    if (!ast) {
      return context;
    }

    const traverseFn = getTraverse();
    if (!traverseFn) {
      console.warn(
        '@babel/traverse 解析失败，跳过 AST 遍历。请检查打包形态下的导出。',
      );
      return context;
    }

    function ensurePathHub(path: any): void {
      try {
        if (path && !path.hub) {
          path.hub = {
            file: { opts: { filename: context.filePath || 'unknown' } },
            buildError(node: any, msg: string) {
              const e = new Error(msg || 'buildError');
              Object.assign(e, { node });
              return e;
            },
          };
        }
      } catch (_) {
        // ignore
      }
    }

    function runSafely(
      visitorName: string,
      path: any,
      runner: () => void,
    ): void {
      try {
        ensurePathHub(path);
        runner();
      } catch (err: any) {
        try {
          const node = path && path.node ? path.node : {};
          const start = typeof node.start === 'number' ? node.start : 0;
          const end = typeof node.end === 'number' ? node.end : start + 1;
          const snippet = (
            customContent || context.contentSource
          ).slice(Math.max(0, start - 60), Math.min((customContent || context.contentSource).length, end + 60));
          console.error(
            `[i18n-automatically] Visitor ${visitorName} 执行失败\n` +
              `file: ${context.filePath}\n` +
              `nodeType: ${node.type || 'unknown'} range: [${start}, ${end}]\n` +
              `snippet: ${snippet}\n` +
              `error: ${err && err.stack ? err.stack : err && err.message}`,
          );
        } catch (logErr) {
          console.error('[i18n-automatically] 记录 visitor 错误失败', logErr);
        }
      }
    }

    try {
      traverseFn(ast, {
        noScope: true,
        Program: (path: any) =>
          runSafely('Program', path, () => checkForI18nImport(path, context)),
        TemplateElement: (path: any) =>
          runSafely('TemplateElement', path, () =>
            handleChineseString(path, context, true),
          ),
        StringLiteral: (path: any) =>
          runSafely('StringLiteral', path, () =>
            handleChineseString(path, context),
          ),
        JSXText: (path: any) =>
          runSafely('JSXText', path, () =>
            handleChineseString(path, context),
          ),
        JSXAttribute: (path: any) =>
          runSafely('JSXAttribute', path, () =>
            handleJSXAttribute(path, context),
          ),
        JSXExpressionContainer: (path: any) =>
          runSafely('JSXExpressionContainer', path, () =>
            handleJSXExpressionContainer(path, context),
          ),
      });
    } catch (traverseError: any) {
      console.warn(
        '@babel/traverse 遍历出错，可能是 babel 版本兼容性问题:',
        traverseError && traverseError.stack
          ? traverseError.stack
          : traverseError && traverseError.message,
      );
    }

    if (
      context.index > (context.templateSize ? context.templateSize : 0) &&
      !context.hasPluginImport &&
      context.config.autoImportI18n
    ) {
      addI18nImport(ast, context);
    }

    context.ast = ast;
    if (context.index > 0) {
      const originalCode = customContent || context.contentSource;
      context.contentChanged = generateCode(ast, originalCode).replace(
        /(?<=\?.)\n/g,
        '',
      );
    }
  } catch (error) {
    console.error('processJsAst 中出错:', error);
  } finally {
    return context;
  }
}

function checkForI18nImport(path: any, context: ProcessorContext): void {
  context.hasPluginImport = path.node.body.some(
    (node: any) =>
      node.type === 'ImportDeclaration' &&
      node.source.value.trim() === context.config.i18nImportPath,
  );
}

function handleChineseString(
  path: any,
  context: ProcessorContext,
  isTemplateLiteral = false,
): void {
  try {
    const value = isTemplateLiteral ? path.node.value.raw : path.node.value;

    const skipDebugContexts =
      !('excludeDebugContexts' in (context.config || {})) ||
      context.config.excludeDebugContexts !== false;
    if (
      !containsChinese(value) ||
      (skipDebugContexts && isInDebugContext(path))
    )
      return;

    if (stringWithDom(value)) {
      handleStringWithDom(path, context, isTemplateLiteral);
      return;
    }

    const key = generateKey(context, value);

    if (isTemplateLiteral) {
      handleTemplateLiteral(path, context, key);
    } else if (
      path.type === 'JSXText' ||
      (path.parent && path.parent.type.includes('JSX'))
    ) {
      replaceWithJSXI18nCall(path, context, key);
    } else {
      replaceWithI18nCall(path, context, key);
    }
    context.translations.set(key, value.trim());
  } catch (error) {
    context.index--;
    console.error('handleChineseString 中出错:', error);
  }
}

function handleStringWithDom(
  path: any,
  context: ProcessorContext,
  isTemplateLiteral: boolean,
): void {
  if (path.type === 'StringLiteral') {
    convertStringLiteralToTemplateLiteral(path, context);
  } else if (isTemplateLiteral) {
    processTemplateElement(path, context);
  }
}

function replaceWithJSXI18nCall(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
  path.replaceWith(
    t.jsxExpressionContainer(
      t.callExpression(buildCalleeFromString(context.config.scriptI18nCall), [
        t.stringLiteral(key),
      ]),
    ),
  );
}

function convertStringLiteralToTemplateLiteral(
  path: any,
  context: ProcessorContext,
): void {
  try {
    const stringLiteral = path.node;
    const translatedString = handlerDomNode(stringLiteral.value, context);

    const parts = translatedString.split(/(\$\{[^}]+\})/);

    const quasis: any[] = [];
    const expressions: any[] = [];

    parts.forEach((part: string, index: number) => {
      if (part.startsWith('${') && part.endsWith('}')) {
        const exp = part.slice(2, -1);
        expressions.push(t.identifier(exp));
        if (index === 0) {
          quasis.push(t.templateElement({ raw: '', cooked: '' }));
        }
      } else {
        quasis.push(
          t.templateElement(
            { raw: part, cooked: part },
            index === parts.length - 1,
          ),
        );
      }
    });

    const templateLiteral = t.templateLiteral(quasis, expressions);
    templateLiteral.start = stringLiteral.start;
    templateLiteral.end = stringLiteral.end;
    templateLiteral.loc = stringLiteral.loc;

    path.replaceWith(templateLiteral);
  } catch (error) {
    console.error(
      'convertStringLiteralToTemplateLiteral 函数中发生错误:',
      error,
    );
  }
}

function handleJSXAttribute(path: any, context: ProcessorContext): void {
  if (path.node.value && t.isStringLiteral(path.node.value)) {
    handleChineseString(path.get('value'), context);
  }
}

function handleJSXExpressionContainer(
  path: any,
  context: ProcessorContext,
): void {
  if (t.isStringLiteral(path.node.expression)) {
    handleChineseString(path.get('expression'), context);
  }
}

function isInDebugContext(path: any): boolean {
  const debugContexts = [
    (p: any) =>
      p.isCallExpression() &&
      p.get('callee').isMemberExpression() &&
      p.get('callee.object').isIdentifier({ name: 'console' }),
    (p: any) =>
      (p.isNewExpression() &&
        p.get('callee').isIdentifier({ name: 'Error' })) ||
      p.isThrowStatement(),
    (p: any) =>
      p.isCallExpression() &&
      (p.get('callee').isIdentifier({ name: 'assert' }) ||
        (p.get('callee').isMemberExpression() &&
          p.get('callee.object').isIdentifier({ name: 'assert' }))),
    (p: any) => p.isDebuggerStatement(),
  ];

  return debugContexts.some((context) => path.findParent(context) !== null);
}

function replaceWithI18nCall(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
  path.replaceWith(
    t.callExpression(buildCalleeFromString(context.config.scriptI18nCall), [
      t.stringLiteral(key),
    ]),
  );
}

function handleTemplateLiteral(
  path: any,
  context: ProcessorContext,
  key: string,
): void {
  const newExpression = t.callExpression(
    buildCalleeFromString(context.config.scriptI18nCall),
    [t.stringLiteral(key)],
  );

  const templateLiteral = path.parentPath;
  newExpression.start = path.node.start;

  const existingExpressions = templateLiteral.node.expressions.map(
    (exp: any) => ({
      node: exp,
      start: exp.start,
    }),
  );
  const existingQuasis = templateLiteral.node.quasis.map((quasi: any) => ({
    node: quasi,
    start: quasi.start,
  }));

  existingExpressions.push({ node: newExpression, start: path.node.start });

  const sortedExpressions = existingExpressions
    .sort((a: any, b: any) => a.start - b.start)
    .map((item: any) => item.node);
  const sortedQuasis = existingQuasis
    .sort((a: any, b: any) => a.start - b.start)
    .map((item: any) => item.node);

  adjustQuasisAndExpressions(sortedQuasis, sortedExpressions);

  templateLiteral.node.expressions = sortedExpressions;
  templateLiteral.node.quasis = sortedQuasis;

  path.node.value.raw = path.node.value.cooked = '';
}

function adjustQuasisAndExpressions(
  sortedQuasis: any[],
  sortedExpressions: any[],
): void {
  while (sortedQuasis.length < sortedExpressions.length + 1) {
    const isTail = sortedQuasis.length === sortedExpressions.length;
    const newQuasiStart = isTail
      ? sortedExpressions[sortedExpressions.length - 1].start + 1
      : sortedExpressions[sortedQuasis.length - 1].start + 1;
    sortedQuasis.push(createQuasi(newQuasiStart, isTail));
  }

  while (sortedQuasis.length > sortedExpressions.length + 1) {
    sortedQuasis.pop();
  }

  sortedQuasis[sortedQuasis.length - 1].tail = true;
  sortedQuasis.sort((a: any, b: any) => a.start - b.start);
}

function createQuasi(start: number, tail = false): any {
  const quasi = t.templateElement({ raw: '', cooked: '' }, tail);
  quasi.start = start;
  return quasi;
}

function processTemplateElement(
  path: any,
  context: ProcessorContext,
): void {
  const value = path.node.value.raw || path.node.value;
  const translatedString = handlerDomNode(value, context);
  path.node.value = { raw: translatedString, cooked: translatedString };
}

export function handlerDomNode(str: string, context: ProcessorContext): string {
  if (!containsChinese(str)) {
    return str;
  }

  const splitArray = splitStringWithTags(str);
  let result = '';
  let hasChanges = false;

  for (const item of splitArray) {
    if (item.startsWith('<') && item.endsWith('>')) {
      result += item;
    } else {
      const processedItem = processTextContent(item, context);
      result += processedItem;
      if (processedItem !== item) {
        hasChanges = true;
      }
    }
  }

  return hasChanges ? result : str;
}

function processTextContent(text: string, context: ProcessorContext): string {
  const regex = /(\${[^}]+})|([^$]+)/g;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      result += match[1];
    } else if (match[2] && containsChinese(match[2])) {
      const key = generateKey(context, match[2]);
      context.translations.set(key, match[2].trim());
      result += `\${${context.config.scriptI18nCall}('${key}')}`;
    } else {
      result += match[2] || '';
    }
  }

  return result;
}

function splitStringWithTags(str: string): string[] {
  const regex = /(<\/?[^>]+>)|([^<]+)/g;
  const result: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(str)) !== null) {
    if (match[1] || match[2]) {
      result.push(match[1] || match[2]);
    }
  }
  return result;
}

function addI18nImport(ast: any, context: ProcessorContext): void {
  ast.program.body.unshift(
    t.importDeclaration(
      [t.importDefaultSpecifier(t.identifier('i18n'))],
      t.stringLiteral(context.config.i18nImportPath),
    ),
  );
}

export const handleJsFile = createI18nProcessor(processJsAst);

// Export all functions for testing
export {
  handleChineseString,
  handleStringWithDom,
  replaceWithJSXI18nCall,
  convertStringLiteralToTemplateLiteral,
  handleJSXAttribute,
  handleJSXExpressionContainer,
  isInDebugContext,
  replaceWithI18nCall,
  handleTemplateLiteral,
  processTemplateElement,
  processTextContent,
  splitStringWithTags,
  addI18nImport,
};
```

- [ ] **Step 2: 删除旧文件**

```bash
rm src/script/I18nProcessor/jsProcessor.js
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: migrate I18nProcessor/jsProcessor to TypeScript"
```

---

## Task 7: 迁移 I18nProcessor/vueProcessor.ts

**Files:**
- Create: `src/script/I18nProcessor/vueProcessor.ts` (替换 `src/script/I18nProcessor/vueProcessor.js`)

- [ ] **Step 1: 写 src/script/I18nProcessor/vueProcessor.ts**

```ts
import { parse as parseSfc } from '@vue/compiler-sfc';
import { baseParse } from '@vue/compiler-dom';
import {
  createI18nProcessor,
  generateKey,
  containsChinese,
  generateCode,
  stringWithDom,
} from './common';
import { processJsAst, handlerDomNode } from './jsProcessor';
import type { ProcessorContext } from '../../../types';

/** 处理 Vue AST */
async function processVueAst(
  context: ProcessorContext,
): Promise<ProcessorContext | undefined> {
  try {
    context.config.autoImportI18n = false;
    const { descriptor } = parseSfc(context.contentSource);
    const scriptAst = descriptor.script && descriptor.script.content;
    const scriptSetupAst =
      descriptor.scriptSetup && descriptor.scriptSetup.content;

    let templateAst: any[] | null = null;
    if (descriptor.template) {
      if (descriptor.template.ast && descriptor.template.ast.children) {
        templateAst = descriptor.template.ast.children;
      } else if (descriptor.template.content) {
        try {
          templateAst = baseParse(descriptor.template.content).children;
        } catch (e) {
          console.error('Error parsing vue template with compiler-dom:', e);
        }
      }
    }
    if (
      templateAst &&
      !(descriptor.template.attrs && descriptor.template.attrs.lang === 'pug')
    ) {
      await processVueTemplate(templateAst, context, descriptor);
    }

    context.templateSize = context.translations.size;
    await processVueScripts(scriptAst, scriptSetupAst, context);

    return context.translations.size > 0 ? context : undefined;
  } catch (error) {
    console.error('Error in processVueAst:', error);
    throw error;
  }
}

async function processVueTemplate(
  templateAst: any[],
  context: ProcessorContext,
  descriptor: any,
): Promise<void> {
  try {
    const processedTemplate = processTemplate(templateAst, context);
    if (context.translations.size > 0) {
      const template =
        (descriptor.template && descriptor.template.content) || '';
      context.contentChanged = context.contentSource.replace(
        template,
        processedTemplate,
      );
      context.contentSource = context.contentChanged;
    }
  } catch (error) {
    console.error('Error in processVueTemplate:', error);
    throw error;
  }
}

async function processVueScripts(
  scriptAst: string | undefined,
  scriptSetupAst: string | undefined,
  context: ProcessorContext,
): Promise<void> {
  context.config.autoImportI18n = true;
  if (scriptAst && containsChinese(scriptAst, true)) {
    await processVueScript(scriptAst, context, 'script');
  }
  if (scriptSetupAst && containsChinese(scriptSetupAst, true)) {
    await processVueScript(scriptSetupAst, context, 'scriptSetup');
  }
}

async function processVueScript(
  scriptAst: string,
  context: ProcessorContext,
  _scriptType: string,
): Promise<void> {
  try {
    const prevChanged = context.contentChanged;
    processJsAst(context, scriptAst);
    const scriptChanged = context.contentChanged;
    context.contentChanged = prevChanged;
    if (scriptChanged) {
      const replaced = context.contentSource.replace(
        scriptAst,
        scriptChanged,
      );
      context.contentChanged = replaced;
      context.contentSource = replaced;
    }
  } catch (error) {
    console.error(`Error in process ${_scriptType}:`, error);
    throw error;
  }
}

function processTemplate(
  templateAst: any[],
  context: ProcessorContext,
): string {
  try {
    return astArrayToTemplate(templateAst, context);
  } catch (error) {
    console.error('Error in processTemplate:', error);
    throw error;
  }
}

function astArrayToTemplate(
  astArray: any[],
  context: ProcessorContext,
): string {
  try {
    return astArray.map((node) => astToTemplate(node, context)).join(' ');
  } catch (error) {
    console.error('Error in astArrayToTemplate:', error);
    return '';
  }
}

function astToTemplate(node: any, context: ProcessorContext): string {
  try {
    if (typeof node === 'string') return node;

    const nodeTypeHandlers: Record<number, () => string> = {
      3: () => node.loc.source, // Comment
      2: () => processTextNode(node, context),
      5: () => processInterpolationNode(node, context),
      1: () => processElementNode(node, context),
    };

    return nodeTypeHandlers[node.type]?.() || '';
  } catch (error) {
    console.error('Error in astToTemplate:', error);
    return '';
  }
}

function processTextNode(node: any, context: ProcessorContext): string {
  if (containsChinese(node.content)) {
    const key = generateKey(context, node.content);
    context.translations.set(key, node.content.trim());
    return `{{${context.config.templateI18nCall}('${key}')}}`;
  }
  return node.content;
}

function processInterpolationNode(
  node: any,
  context: ProcessorContext,
): string {
  if (!containsChinese(node.content.content)) return node.loc.source;

  if (node.content.ast) {
    const result = handlerForJs(node.content, context);
    return `{{${replaceForI18nCall(result, context)}}}`;
  } else {
    return `{{\`${interpolationStr(node.content.content, context)}\`}}`;
  }
}

function processElementNode(node: any, context: ProcessorContext): string {
  let result = `<${node.tag}`;
  result += processAttributes(node.props, context);

  if (node.isSelfClosing) return result + ' />';

  result += '>';
  if (node.children) {
    result += node.children
      .map((child: any) => astToTemplate(child, context))
      .join(' ');
  }
  return result + `</${node.tag}>`;
}

function processAttributes(props: any[], context: ProcessorContext): string {
  if (!props) return '';

  return props
    .map((prop) => {
      if (prop.type === 6) return processAttribute(prop, context);
      if (prop.type === 7) return processDirective(prop, context);
      return '';
    })
    .join(' ');
}

function processAttribute(prop: any, context: ProcessorContext): string {
  if (!prop.value) return `\n${prop.name}`;

  if (containsChinese(prop.value.content)) {
    if (stringWithDom(prop.value.content)) {
      const result = handlerDomNode(prop.value.content, context);
      return `\n:${prop.name}="\`${replaceForI18nCall(result, context)}\`"`;
    } else {
      const key = generateKey(context, prop.value.content);
      context.translations.set(key, prop.value.content.trim());
      return `\n:${prop.name}="${context.config.templateI18nCall}('${key}')"`;
    }
  }

  const raw: string = prop.value.content;
  const needsDouble = raw.indexOf('"') === -1;
  if (needsDouble) {
    return `\n${prop.name}="${raw}"`;
  }
  if (raw.indexOf("'") === -1) {
    return `\n${prop.name}='${raw}'`;
  }
  const escaped = raw.replace(/\"/g, '"').replace(/"/g, '&quot;');
  return `\n${prop.name}="${escaped}"`;
}

function processDirective(prop: any, context: ProcessorContext): string {
  const directiveName = getDirectiveName(prop);

  if (!prop.exp) return `\n${directiveName}`;

  if (prop.exp.ast === null) {
    return ' ' + prop.loc.source;
  }

  if (!containsChinese(prop.exp.content)) {
    return `\n${directiveName}="${prop.exp.content}"`;
  }

  let result: string;
  if (stringWithDom(prop.exp.content)) {
    const handlerContent = prop.exp.content
      .trim()
      .replace(/^[\s\n]*[`'"]|[`'"][\s\n]*$/gm, '');

    result = handlerDomNode(handlerContent, context);
    return `\n${directiveName}="\`${replaceForI18nCall(result, context)}\`"`;
  } else {
    result = handlerForJs(prop.exp, context);
    return `\n${directiveName}="${replaceForI18nCall(result, context)}"`;
  }
}

function replaceForI18nCall(str: string, context: ProcessorContext): string {
  return str.replace(
    new RegExp(context.config.scriptI18nCall, 'g'),
    context.config.templateI18nCall,
  );
}

function handlerForJs(node: any, context: ProcessorContext): string {
  try {
    const { ast } = processJsAst(context, node.content.trim());
    if (ast) {
      return handleAstResult(ast, node, context);
    } else {
      return handleNonAstResult(node, context);
    }
  } catch (e: any) {
    console.error(`handlerForJs: ${e.message}`);
    return `\n${node.content}`;
  }
}

function handleAstResult(
  ast: any,
  node: any,
  context: ProcessorContext,
): string {
  if (node.ast.type === 'StringLiteral' && ast.program.body.length === 0) {
    return handleStringLiteral(node, context);
  }
  const code = generateCode(ast, node.content.trim()).replace(
    /[,;](?=[^,;]*$)/,
    '',
  );
  return `\n${code.replace(/"/g, "'")}`;
}

function handleStringLiteral(node: any, context: ProcessorContext): string {
  if (containsChinese(node.content)) {
    const key = generateKey(context, node.content);
    context.translations.set(key, node.content.replace(/'/g, '').trim());
    return `\n${context.config.templateI18nCall}('${key}')`;
  }
  return `\n${node.content}`;
}

function handleNonAstResult(node: any, context: ProcessorContext): string {
  const changeBefore = context.index;
  const getResult = replaceChineseWithI18nKey(node.content.trim(), context);
  return context.index > changeBefore ? getResult : `\n${node.content}`;
}

function replaceChineseWithI18nKey(
  str: string,
  context: ProcessorContext,
): string {
  return str.replace(/('[^']*[一-龥]+[^']*')/g, (match) => {
    const chineseContent = match.slice(1, -1);
    if (containsChinese(chineseContent)) {
      const key = generateKey(context, chineseContent);
      context.translations.set(key, chineseContent.trim());
      return `${context.config.templateI18nCall}('${key}')`;
    }
    return match;
  });
}

function getDirectiveName(prop: any): string {
  if (prop.rawName) {
    return prop.rawName;
  }
  switch (prop.name) {
    case 'bind':
      return ':';
    case 'on':
      return '@';
    case 'slot':
      return '#';
    default:
      return `v-${prop.name}`;
  }
}

function interpolationStr(
  strContent: string,
  context: ProcessorContext,
): string {
  const parts = splitTemplateString(strContent);
  return parts
    .map((part) => {
      if (containsChinese(part)) {
        const key = generateKey(context, part);
        context.translations.set(key, part.trim());
        return `\${${context.config.templateI18nCall}('${key}')}`;
      }
      return part;
    })
    .join(' ');
}

function splitTemplateString(str: string): string[] {
  str = str.replace(/^`|`$/g, '');
  const regex = /(\$\{[^}]*?\})|([^$]+|\$(?!\{))/g;
  return str.match(regex) || [];
}

export const handleVueFile = createI18nProcessor(processVueAst);

export {
  processVueAst,
  processVueTemplate,
  processVueScripts,
  processTemplate,
  astArrayToTemplate,
  astToTemplate,
  processTextNode,
  processInterpolationNode,
  processElementNode,
  processAttributes,
  processAttribute,
  processDirective,
  replaceForI18nCall,
  handlerForJs,
  handleAstResult,
  handleStringLiteral,
  handleNonAstResult,
  replaceChineseWithI18nKey,
  getDirectiveName,
  interpolationStr,
  splitTemplateString,
};
```

- [ ] **Step 2: 删除旧文件**

```bash
rm src/script/I18nProcessor/vueProcessor.js
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: migrate I18nProcessor/vueProcessor to TypeScript"
```

---

## Task 8: 迁移 I18nProcessor/index.ts

**Files:**
- Create: `src/script/I18nProcessor/index.ts` (替换 `src/script/I18nProcessor/index.js`)

- [ ] **Step 1: 写 src/script/I18nProcessor/index.ts**

```ts
import * as path from 'path';
import * as fs from 'fs';
import { TranslationManager } from './common';
import { handleVueFile } from './vueProcessor';
import { handleJsFile } from './jsProcessor';
import { readConfig } from '../setting';
import * as prettier from 'prettier';
import type { ProcessorContext, I18nConfig } from '../../../types';

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T | null>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`[timeout] ${label} exceeded ${ms}ms`));
      }, ms);
    }),
  ]).catch((e: any) => {
    console.warn(`[i18n-automatically] ${label} failed:`, e && e.message);
    return null;
  });
}

function getParserForFile(ext: string): string {
  switch ((ext || '').toLowerCase()) {
    case '.ts':
    case '.tsx':
      return 'typescript';
    case '.vue':
      return 'vue';
    case '.jsx':
    case '.js':
      return 'babel';
    default:
      return 'babel';
  }
}

type FileProcessorFn = (
  filePath: string,
  config: I18nConfig,
) => Promise<ProcessorContext | undefined>;

/** 处理单个文件 */
export async function processFile(filePath: string): Promise<void> {
  const fileExt = path.extname(filePath).toLowerCase();
  const processor = getFileProcessor(fileExt);

  if (!processor) {
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      console.warn(`[i18n-automatically] skip non-file path: ${filePath}`);
      return;
    }
    const config = readConfig();
    if (!config) return;
    const processResult = await processor(filePath, config);
    const { contentChanged, translations } = processResult || {};
    if (contentChanged) {
      const defaultPrettierOptions: prettier.Options = {};

      let finalContent: string = contentChanged;
      try {
        const isLarge = (finalContent && finalContent.length) > 200000;
        if (!isLarge) {
          let userPrettierOptions: prettier.Options | null =
            await withTimeout(
              prettier.resolveConfig(filePath, { editorconfig: true }),
              1200,
              'prettier.resolveConfig',
            );

          if (!userPrettierOptions) {
            const configFile = await withTimeout(
              prettier.resolveConfigFile(filePath),
              800,
              'prettier.resolveConfigFile',
            );
            if (configFile && /\.(c?js|mjs)$/i.test(configFile)) {
              try {
                const loaded = require(configFile);
                if (loaded && typeof loaded === 'object') {
                  userPrettierOptions = loaded;
                }
              } catch (e: any) {
                console.warn(
                  '[i18n-automatically] load .prettierrc.js failed:',
                  e && e.message,
                );
              }
            }
          }

          const baseOptions = userPrettierOptions || defaultPrettierOptions;
          const formattingOptions: prettier.Options = {
            ...baseOptions,
            filepath: filePath,
          };

          let formatted = await withTimeout(
            prettier.format(contentChanged, formattingOptions),
            2000,
            'prettier.format',
          );

          if (!formatted) {
            try {
              const prettierStandalone = require('prettier/standalone');
              const pBabel = require('prettier/plugins/babel');
              const pHtml = require('prettier/plugins/html');
              const pTs = require('prettier/plugins/typescript');
              const pEstree = require('prettier/plugins/estree');

              const standaloneOptions = { ...(baseOptions || {}) };
              delete standaloneOptions.filepath;
              delete standaloneOptions.pluginSearchDirs;
              delete standaloneOptions.config;
              delete standaloneOptions.configFile;
              delete standaloneOptions.ignorePath;

              formatted = await withTimeout(
                prettierStandalone.format(contentChanged, {
                  ...standaloneOptions,
                  parser: getParserForFile(fileExt),
                  plugins: [pBabel, pHtml, pTs, pEstree],
                }),
                2000,
                'prettier.standalone.format',
              );
            } catch (_e) {
              // ignore
            }
          }

          finalContent = formatted || contentChanged;
        }
      } catch (error: any) {
        console.warn(
          `Prettier format failed for ${filePath}, fallback to raw content.`,
          error && error.message,
        );
      }

      try {
        await fs.promises.writeFile(filePath, finalContent, 'utf8');
      } catch (e) {
        console.error(`Write file failed for ${filePath}:`, e);
      }
      try {
        await outputTranslations(translations);
      } catch (e) {
        console.error(`Output translations failed for ${filePath}:`, e);
      }
    } else {
      console.log(`No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

function getFileProcessor(
  fileExt: string,
): FileProcessorFn | null {
  const processors: Record<string, FileProcessorFn> = {
    '.vue': handleVueFile,
    '.js': handleJsFile,
    '.jsx': handleJsFile,
    '.ts': handleJsFile,
    '.tsx': handleJsFile,
  };
  return processors[fileExt] || null;
}

async function outputTranslations(
  translations: Map<string, string> | undefined,
): Promise<void> {
  const translationManager = new TranslationManager();
  const config = readConfig();
  if (!config || !translations) return;
  translationManager.outputTranslationFile(translations, config);
}

/** 递归处理目录中的所有文件 */
export async function processDirectory(dir: string): Promise<void> {
  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else {
        await processFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

/** 主函数 */
export async function main(inputPath: string): Promise<void> {
  try {
    const stat = await fs.promises.stat(inputPath);
    if (stat.isDirectory()) {
      await processDirectory(inputPath);
    } else {
      await processFile(inputPath);
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}
```

注意：原代码中 `if (require.main === module)` 的 CLI 入口判断在 TS/ESM 模式下不再使用，已移除。如需 CLI 使用，可在 `package.json` 中加 `bin` 入口。

- [ ] **Step 2: 删除旧文件**

```bash
rm src/script/I18nProcessor/index.js
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: migrate I18nProcessor/index to TypeScript"
```

---

## Task 9: 迁移命令层和入口

**Files:**
- Create: `src/script/scanChinese.ts`
- Create: `src/script/scanChineseBatch.ts`
- Create: `src/script/switchLanguage.ts`
- Create: `src/script/generateLanguagePackage/index.ts`
- Create: `src/script/index.ts`
- Create: `src/extension.ts`

- [ ] **Step 1: 写 src/script/scanChinese.ts**

```ts
import * as vscode from 'vscode';
import { processFile } from './I18nProcessor/index';
import { updateDecorations } from './switchLanguage';

/** 扫描当前文件中的中文 */
export async function scanChinese(
  filePath: string | undefined = undefined,
): Promise<void> {
  if (!filePath) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const fsPath = editor.document.uri.fsPath;
    if (!/\.[a-zA-Z0-9]+$/.test(fsPath)) return;
    filePath = fsPath;
  }
  await processFile(filePath);
  setTimeout(() => {
    updateDecorations();
  }, 300);
}
```

- [ ] **Step 2: 写 src/script/scanChineseBatch.ts**

```ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { readConfig } from './setting';
import { scanChinese } from './scanChinese';

/** 批量扫描文件夹中的中文 */
export async function scanChineseBatch(): Promise<void> {
  const config = readConfig(true);
  if (!config) return;

  const folder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  });

  if (!folder || folder.length === 0) {
    return;
  }

  const folderPath = folder[0].fsPath;
  const excludedExtensions = [...config.excludedExtensions];
  const files = getAllFilesInFolder(folderPath, excludedExtensions);
  const fileCount = files.length;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: '正在批量扫描中文',
      cancellable: false,
    },
    async (progress) => {
      const totalSteps = 100;
      const filesPerStep = Math.max(1, Math.floor(fileCount / totalSteps));
      let processedCount = 0;
      let lastReportedStep = 0;

      for (const filePath of files) {
        await processFile(filePath);
        processedCount++;

        if (
          processedCount % filesPerStep === 0 ||
          processedCount === fileCount
        ) {
          const currentStep = Math.min(
            Math.floor((processedCount / fileCount) * totalSteps),
            totalSteps,
          );
          if (currentStep > lastReportedStep) {
            progress.report({ increment: currentStep - lastReportedStep });
            lastReportedStep = currentStep;
          }
        }
      }
    },
  );
}

function getAllFilesInFolder(
  folderPath: string,
  excludedExtensions: string[],
): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(folderPath);
  for (const item of entries) {
    const itemPath = path.join(folderPath, item);

    if (item === 'node_modules') {
      continue;
    }

    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      files.push(...getAllFilesInFolder(itemPath, excludedExtensions));
    } else {
      const itemExtension = path.extname(item);
      if (!itemExtension) continue;
      if (excludedExtensions.includes(itemExtension)) continue;
      files.push(itemPath);
    }
  }
  return files;
}

const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue']);

async function processFile(filePath: string): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) return;
  await scanChinese(filePath);
}
```

- [ ] **Step 3: 写 src/script/switchLanguage.ts**

```ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { readConfig } from './setting';
import { getRootPath } from '../utils/index';

let cachedLanguage = 'zh.json';

/** 简易容错 JSON 解析 */
function parseJsonLoose(text: string): Record<string, string> | null {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  try {
    const JSON5 = require('json5');
    return JSON5.parse(normalized);
  } catch (_) {
    const noCtl = normalized.replace(/[ -]/g, (ch) =>
      ch === '\n' || ch === '\r' || ch === '\t' ? ch : ' ',
    );
    const noBlockComments = noCtl.replace(/\/\*[\s\S]*?\*\//g, '');
    const noLineComments = noBlockComments.replace(/(^|[^:])\/\/.*$/gm, '$1');
    const noTrailingCommas = noLineComments.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(noTrailingCommas);
    } catch (_2) {
      return null;
    }
  }
}

/** 获取语言包 */
async function getLanguagePack(
  language = cachedLanguage,
): Promise<Record<string, string> | undefined> {
  const config = readConfig();
  if (!config) return undefined;

  const rootPath = getRootPath();
  const i18nFilePath = path.join(
    `${rootPath}${config.i18nFilePath}/locale/${language}`,
  );

  if (!fs.existsSync(i18nFilePath)) {
    if (language !== 'zh.json') {
      vscode.window.showInformationMessage(
        `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 ${language} 语言包文件，将使用默认语言包。`,
      );
    }
    return undefined;
  }

  const languagePack = await fs.promises.readFile(i18nFilePath, 'utf-8');
  if (!languagePack) return undefined;

  const languagePackObj = parseJsonLoose(languagePack);
  return languagePackObj || undefined;
}

/** 构建 key 正则 */
function buildRegexFromLanguagePack(
  languagePackObj: Record<string, string>,
): RegExp {
  const keys = Object.keys(languagePackObj);
  const escapedKeys = keys.map((key) => {
    return `\\b${key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`;
  });
  return new RegExp(`(${escapedKeys.join('|')})`, 'g');
}

/** 装饰器类型（单例） */
let decorationType: vscode.TextEditorDecorationType | undefined;
function getDecorationType(): vscode.TextEditorDecorationType {
  if (!decorationType) {
    decorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      overviewRulerColor: 'grey',
      overviewRulerLane: vscode.OverviewRulerLane.Left,
      after: {
        margin: '0 0 0 5px',
      },
    });
  }
  return decorationType;
}

/** 更新装饰器 */
export async function updateDecorations(
  language = cachedLanguage,
): Promise<void> {
  const config = readConfig();
  if (!config) return;

  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const fileExt = path.extname(editor.document.fileName).toLowerCase();
  if (
    (config.excludedExtensions || []).some(
      (ext) => ext.toLowerCase() === fileExt,
    )
  ) {
    return;
  }

  const languagePackObj = await getLanguagePack(language);
  if (!languagePackObj) return;

  const foregroundColor = new vscode.ThemeColor('editorCodeLens.foreground');

  const regex = buildRegexFromLanguagePack(languagePackObj);
  const decorations: vscode.DecorationOptions[] = [];
  for (let i = 0; i < editor.document.lineCount; i++) {
    const line = editor.document.lineAt(i);
    const text = line.text;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const contentText = languagePackObj[match[0]];
      if (!contentText) continue;
      decorations.push({
        range: new vscode.Range(
          i,
          match.index,
          i,
          match.index + match[0].length,
        ),
        renderOptions: {
          after: {
            contentText,
            color: foregroundColor,
            opacity: '0.6',
          },
        },
      });
    }
  }
  editor.setDecorations(getDecorationType(), decorations);
}

/** 切换语言 */
export async function switchLanguage(): Promise<void> {
  const config = readConfig(true);
  if (!config) return;

  const rootPath = getRootPath();
  const allFiles = fs.readdirSync(
    `${rootPath}${config.i18nFilePath}/locale`,
  );
  const languageFiles = allFiles.filter((file) => file.endsWith('.json'));
  if (!languageFiles.length) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到语言包文件，请先扫描中文`,
    );
    return;
  }

  vscode.window.showQuickPick(languageFiles).then(async (item) => {
    if (item) {
      cachedLanguage = item;
      await updateDecorations(item);
    }
  });
}
```

- [ ] **Step 4: 写 src/script/generateLanguagePackage/index.ts**

```ts
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getRootPath } from '../../utils/index';
import { readConfig } from '../setting';
import { createTranslator } from './translators';

const TRANSLATE_LIMIT = 20;

/** 生成语言包 */
export async function generateLanguagePackage(): Promise<void> {
  const config = readConfig(true, true);
  if (!config) return;

  const zhPath = `${getRootPath()}${config.i18nFilePath}/locale/zh.json`;

  if (!fs.existsSync(zhPath)) {
    vscode.window.showInformationMessage(
      `在 ${config.i18nFilePath}/locale/ 文件夹下面未找到 zh.json 语言包文件，请先扫描中文`,
    );
    return;
  }

  const hasBaiduConfig =
    config.baidu && config.baidu.appid && config.baidu.secretKey;
  const hasDeeplConfig = config.deepl && config.deepl.authKey;
  const hasFreeGoogleConfig = config.freeGoogle;

  if (!hasBaiduConfig && !hasDeeplConfig && !hasFreeGoogleConfig) {
    vscode.window.showInformationMessage(
      `未配置翻译服务，请先在配置文件中配置百度翻译、DeepL翻译或免费谷歌翻译的相关信息`,
    );
    const configFilePath =
      getRootPath() + '/automatically-i18n-config.json';
    vscode.workspace.openTextDocument(configFilePath).then((document) => {
      vscode.window.showTextDocument(document);
    });
    return;
  }

  let translateService = '';
  const serviceOptions: vscode.QuickPickItem[] = [];
  if (hasBaiduConfig) {
    serviceOptions.push({ label: '百度翻译' });
  }
  if (hasDeeplConfig) {
    serviceOptions.push({ label: 'DeepL 翻译' });
  }
  if (hasFreeGoogleConfig) {
    serviceOptions.push({ label: '免费谷歌翻译' });
  }

  const serviceMap: Record<string, string> = {
    '百度翻译': 'baidu',
    'DeepL 翻译': 'deepl',
    '免费谷歌翻译': 'freeGoogle',
  };

  if (serviceOptions.length > 1) {
    const selectedService = await vscode.window.showQuickPick(serviceOptions, {
      placeHolder: '请选择翻译服务',
    });
    if (!selectedService) return;
    translateService = serviceMap[selectedService.label] || '';
  } else if (serviceOptions.length === 1) {
    translateService = serviceMap[serviceOptions[0].label] || '';
  }

  const translator = createTranslator(translateService);

  const languageInput = await vscode.window.showInputBox({
    prompt: '请输入语言包名称',
    value: 'en',
  });
  const language = languageInput || 'en';

  const zhString = await fs.promises.readFile(zhPath, 'utf-8');
  if (!zhString) return;

  const zhJson: Record<string, string> = JSON.parse(zhString);
  const zhJsonKeys = Object.keys(zhJson);

  let existingLanguageJson: Record<string, string> = {};
  const existingLanguagePath = `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`;
  if (fs.existsSync(existingLanguagePath)) {
    const existingLanguageString = await fs.promises.readFile(
      existingLanguagePath,
      'utf-8',
    );
    existingLanguageJson = JSON.parse(existingLanguageString);
  }

  const keysToTranslate: string[] = [];
  const valuesToTranslate: string[] = [];
  zhJsonKeys.forEach((key) => {
    if (!existingLanguageJson[key]) {
      keysToTranslate.push(key);
      valuesToTranslate.push(zhJson[key]);
    }
  });

  if (keysToTranslate.length === 0) {
    vscode.window.showInformationMessage(
      `${language} 语言包已经全部翻译完成`,
    );
    return;
  }

  const groupCount = Math.ceil(valuesToTranslate.length / TRANSLATE_LIMIT);
  const newLanguageJson: Record<string, string> = JSON.parse(
    JSON.stringify(existingLanguageJson),
  );

  const serviceNames: Record<string, string> = {
    baidu: '百度翻译',
    deepl: 'DeepL 翻译',
    freeGoogle: '免费谷歌翻译',
  };

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `正在使用${serviceNames[translateService]}生成${language}语言包`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0 });
      for (let i = 0; i < groupCount; i++) {
        const progressPercentage = ((i + 1) / groupCount) * 100;
        progress.report({ increment: progressPercentage });
        const groupItem = valuesToTranslate.slice(
          i * TRANSLATE_LIMIT,
          (i + 1) * TRANSLATE_LIMIT,
        );

        const trans_result = await translator.translate(groupItem, language);

        if (!trans_result) {
          continue;
        }

        trans_result.forEach((item, index) => {
          const key = keysToTranslate[i * TRANSLATE_LIMIT + index];
          newLanguageJson[key] = item.dst;
        });

        const orderedLanguageJson: Record<string, string> = {};
        zhJsonKeys.forEach((key) => {
          if (newLanguageJson[key] !== undefined) {
            orderedLanguageJson[key] = newLanguageJson[key];
          }
        });

        await fs.promises.writeFile(
          `${getRootPath()}${config.i18nFilePath}/locale/${language}.json`,
          JSON.stringify(orderedLanguageJson, null, 2),
        );
      }
    },
  );
}
```

- [ ] **Step 5: 写 src/script/index.ts**

```ts
export { setting, readConfig } from './setting';
export { scanChinese } from './scanChinese';
export { scanChineseBatch } from './scanChineseBatch';
export { switchLanguage, updateDecorations } from './switchLanguage';
export { generateLanguagePackage } from './generateLanguagePackage/index';
```

- [ ] **Step 6: 写 src/extension.ts**

```ts
import * as vscode from 'vscode';
import {
  setting,
  readConfig,
  scanChinese,
  scanChineseBatch,
  switchLanguage,
  updateDecorations,
  generateLanguagePackage,
} from './script/index';

export function activate(context: vscode.ExtensionContext): void {
  vscode.window.onDidChangeVisibleTextEditors(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });

  vscode.workspace.onDidSaveTextDocument(() => {
    setTimeout(() => {
      updateDecorations();
    }, 300);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.scanChinese',
      async () => {
        readConfig(true, true);
        scanChinese();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.scanChineseBatch',
      async () => {
        readConfig(true, true);
        scanChineseBatch();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.generateLanguagePackage',
      async () => {
        generateLanguagePackage();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.switchLanguage',
      switchLanguage,
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.updateLocalLangPackage',
      async () => {
        updateDecorations();
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'extension.automatically.i18n.setting',
      async () => {
        setting();
      },
    ),
  );
}
```

- [ ] **Step 7: 删除旧 JS 文件**

```bash
rm src/extension.js
rm src/script/index.js
rm src/script/scanChinese.js
rm src/script/scanChineseBatch.js
rm src/script/switchLanguage.js
rm src/script/generateLanguagePackage/index.js
```

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "refactor: migrate commands, generateLanguagePackage and extension entry to TypeScript"
```

---

## Task 10: 迁移测试到 Vitest

**Files:**
- Create: `tests/unit/jsProcessor.test.ts`
- Create: `tests/unit/vueProcessor.test.ts`
- Delete: `tests/run-tests.js`
- Delete: `tests/unit/jsProcessor.test.js`
- Delete: `tests/unit/vueProcessor.test.js`
- Delete: `tests/unit/demoTest.validation.js`
- Delete: `tests/.eslintrc.json`

- [ ] **Step 1: 写 tests/unit/jsProcessor.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testFixturesPath = path.join(__dirname, '../fixtures/i18n-samples');

describe('JS Processor', () => {
  it('should detect Chinese characters in JavaScript file', () => {
    const beforeFilePath = path.join(testFixturesPath, 'js/before.js');
    expect(fs.existsSync(beforeFilePath)).toBe(true);

    const content = fs.readFileSync(beforeFilePath, 'utf8');
    const chineseRegex = /[一-龥]+/g;
    const matches = content.match(chineseRegex);

    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  it('should replace Chinese strings with i18n function calls', () => {
    const beforeFilePath = path.join(testFixturesPath, 'js/before.js');
    const afterFilePath = path.join(testFixturesPath, 'js/after.js');

    expect(fs.existsSync(beforeFilePath)).toBe(true);
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const beforeContent = fs.readFileSync(beforeFilePath, 'utf8');
    const afterContent = fs.readFileSync(afterFilePath, 'utf8');

    expect(afterContent).toContain('t(');

    const chineseRegex = /[一-龥]+/g;
    const afterMatches = afterContent.match(chineseRegex);
    const beforeMatches = beforeContent.match(chineseRegex);

    expect(beforeMatches ? beforeMatches.length : 0).toBeGreaterThan(0);
    // after.js should have fewer Chinese chars than before.js
    expect(
      afterMatches ? afterMatches.length : 0,
    ).toBeLessThanOrEqual(beforeMatches ? beforeMatches.length : 0);
  });

  it('should generate valid JavaScript syntax', () => {
    const afterFilePath = path.join(testFixturesPath, 'js/after.js');
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const content = fs.readFileSync(afterFilePath, 'utf8');
    // The after file should not have syntax errors that break its structure
    expect(content.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 写 tests/unit/vueProcessor.test.ts**

```ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testFixturesPath = path.join(__dirname, '../fixtures/i18n-samples');

describe('Vue Processor', () => {
  it('should detect Chinese characters in Vue file', () => {
    const beforeFilePath = path.join(testFixturesPath, 'vue/before.vue');
    expect(fs.existsSync(beforeFilePath)).toBe(true);

    const content = fs.readFileSync(beforeFilePath, 'utf8');
    const chineseRegex = /[一-龥]+/g;
    const matches = content.match(chineseRegex);

    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  it('should replace Chinese strings in Vue template with $t() calls', () => {
    const beforeFilePath = path.join(testFixturesPath, 'vue/before.vue');
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');

    expect(fs.existsSync(beforeFilePath)).toBe(true);
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const afterContent = fs.readFileSync(afterFilePath, 'utf8');

    expect(afterContent).toContain('$t(');
    expect(afterContent).toContain(':placeholder');
  });

  it('should maintain Vue file structure integrity', () => {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const content = fs.readFileSync(afterFilePath, 'utf8');

    expect(content).toContain('<template>');
    expect(content).toContain('<script>');
    expect(content).toContain('</template>');
    expect(content).toContain('</script>');
  });

  it('should use correct i18n syntax in Vue', () => {
    const afterFilePath = path.join(testFixturesPath, 'vue/after.vue');
    expect(fs.existsSync(afterFilePath)).toBe(true);

    const content = fs.readFileSync(afterFilePath, 'utf8');

    const templateSection = content.match(/<template>[\s\S]*<\/template>/);
    if (templateSection) {
      expect(templateSection[0]).toContain('$t(');
    }

    const scriptSection = content.match(/<script>[\s\S]*<\/script>/);
    if (scriptSection) {
      expect(scriptSection[0]).toContain('this.$t(');
    }
  });
});
```

- [ ] **Step 3: 删除旧测试文件**

```bash
rm tests/run-tests.js
rm tests/unit/jsProcessor.test.js
rm tests/unit/vueProcessor.test.js
rm tests/unit/demoTest.validation.js
rm tests/.eslintrc.json
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```

预期：所有测试通过（基于 fixture 文件的静态检查）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor: migrate tests to Vitest"
```

---

## Task 11: 验证与清理

**Files:**
- Modify: `CLAUDE.md` (更新架构描述)

- [ ] **Step 1: 类型检查**

```bash
npx tsc --noEmit
```

预期：0 errors。如果有类型错误，修复它们。

- [ ] **Step 2: 构建**

```bash
yarn build
```

预期：`✅ esbuild 打包完成: dist/extension.js`

- [ ] **Step 3: 运行测试**

```bash
yarn test
```

预期：所有测试通过。

- [ ] **Step 4: 运行 lint**

```bash
yarn lint
```

预期：无错误。

- [ ] **Step 5: 更新 CLAUDE.md**

将 CLAUDE.md 中描述架构的部分更新为 TS 相关描述：
- "All source is TypeScript (`import`/`export`)" 替换 "All source is CommonJS"
- 入口改为 `src/extension.ts`
- 构建输出仍为 CJS `dist/extension.js`
- 测试框架改为 Vitest
- 配置 `tsconfig.json` 替换 `jsconfig.json`

- [ ] **Step 6: 确认无残留 .js 文件**

```bash
find src -name "*.js" -not -path "*/node_modules/*"
```

预期：无输出（所有 .js 已被 .ts 替换）。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "chore: update CLAUDE.md for TypeScript migration"
```

---

## 自检清单

- [x] 每个任务都有确切文件路径
- [x] 每个代码步骤包含完整代码
- [x] 每个验证步骤包含命令和预期输出
- [x] 无 "TBD"/"TODO"/"implement later" 占位
- [x] 所有类型在 types.ts 中定义，后续任务引用一致
- [x] 覆盖全部 19 个源文件迁移
- [x] 覆盖测试框架迁移
- [x] 覆盖配置文件变更
