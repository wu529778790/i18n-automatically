# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code extension that scans Chinese text in frontend codebases, replaces it with i18n keys (via AST transformation), and generates translation locale files. Supports Vue SFC, React JSX/TSX, plain JS/TS.

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Bundle via esbuild → dist/extension.js
yarn lint             # ESLint --fix
yarn test:unit        # Run standalone unit tests (node tests/run-tests.js)
yarn test:js          # JS processor tests only
yarn test:vue         # Vue processor tests only
yarn test:all         # Lint + unit tests + VS Code integration tests
yarn test             # VS Code integration tests via @vscode/test-cli
```

Debug: press F5 in VS Code (launch config in `.vscode/launch.json`).

Package for distribution: `vsce package --yarn` (requires `@vscode/vsce` globally).

## Architecture

Entry point: `src/extension.js` → registers 6 VS Code commands (scan, batch scan, generate language pack, switch language, refresh, settings).

Core pipeline in `src/script/`:

- `I18nProcessor/common.js` — Shared utilities: `createI18nProcessor` (factory), `generateKey`, `generateCode` (Babel codegen), `containsChinese`, `TranslationManager` (writes locale JSON).
- `I18nProcessor/jsProcessor.js` — Babel parser + traverse to walk JS/TS/JSX/TSX ASTs. Replaces Chinese string literals, template elements, JSX text/attributes with i18n call expressions. Handles DOM-containing strings specially.
- `I18nProcessor/vueProcessor.js` — Vue SFC parsing via `@vue/compiler-sfc` + `@vue/compiler-dom`. Processes `<template>` AST nodes (text, interpolation, elements, directives) then delegates `<script>`/`<script setup>` to jsProcessor.
- `I18nProcessor/index.js` — Orchestrator: resolves file extension → processor, runs Prettier formatting, writes back, outputs translations.

Translation services in `src/script/generateLanguagePackage/`:

- `translators/` — Strategy pattern via `createTranslator(serviceName)`: Google (free, built-in), Baidu, DeepL.
- `api/` — Low-level HTTP calls for each service.

Config: `src/script/setting.js` reads `automatically-i18n-config.json` from workspace root. Cached in memory; `readConfig(initConfigFile, clearCache)` controls initialization.

Key generation: either component-path-based (`ComponentName-uuid-index`) or MD5-based (same text → same key, configurable via `useMd5Key`).

Utils: `src/utils/index.js` — `getRootPath()`, `saveObjectToPath()`, `generateUniqueId()`.

Build: `scripts/esbuild.js` bundles to `dist/extension.js` (CJS, node20, minified). Babel deps are inlined; Prettier is externalized so it resolves user project config at runtime.

## Key Conventions

- All source is CommonJS (`require`/`module.exports`), bundled by esbuild to a single file.
- Config file lives at workspace root: `automatically-i18n-config.json`.
- Locale files go to `{i18nFilePath}/locale/{lang}.json` (default: `src/i18n/locale/`).
- The `@babel/traverse` export is resolved defensively (multiple fallback paths) due to CJS/ESM interop issues after bundling.
- Prettier is intentionally externalized from the bundle to preserve user config file resolution.
