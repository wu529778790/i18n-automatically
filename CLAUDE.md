# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code extension that scans Chinese text in frontend codebases, replaces it with i18n keys (via AST transformation), and generates translation locale files. Supports Vue SFC, React JSX/TSX, plain JS/TS.

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Bundle via esbuild → dist/extension.js
yarn lint             # ESLint --fix
yarn typecheck        # TypeScript type checking (tsc --noEmit)
yarn test             # Run all unit tests via Vitest
yarn test:watch       # Run tests in watch mode
yarn test:js          # JS processor tests only
yarn test:vue         # Vue processor tests only
yarn test:all         # Lint + typecheck + unit tests
```

Debug: press F5 in VS Code (launch config in `.vscode/launch.json`).

Package for distribution: `vsce package --yarn` (requires `@vscode/vsce` globally).

## Architecture

Entry point: `src/extension.ts` → registers 6 VS Code commands (scan, batch scan, generate language pack, switch language, refresh, settings).

Types: `src/types.ts` — shared interfaces (`I18nConfig`, `ProcessorContext`, `ITranslator`, `TranslateResult`, etc.).

Core pipeline in `src/script/`:

- `I18nProcessor/common.ts` — Shared utilities: `createI18nProcessor` (factory), `generateKey`, `generateCode` (Babel codegen), `containsChinese`, `TranslationManager` (writes locale JSON).
- `I18nProcessor/jsProcessor.ts` — Babel parser + traverse to walk JS/TS/JSX/TSX ASTs. Replaces Chinese string literals, template elements, JSX text/attributes with i18n call expressions. Handles DOM-containing strings specially.
- `I18nProcessor/vueProcessor.ts` — Vue SFC parsing via `@vue/compiler-sfc` + `@vue/compiler-dom`. Processes `<template>` AST nodes (text, interpolation, elements, directives) then delegates `<script>`/`<script setup>` to jsProcessor.
- `I18nProcessor/index.ts` — Orchestrator: resolves file extension → processor, runs Prettier formatting, writes back, outputs translations.

Translation services in `src/script/generateLanguagePackage/`:

- `translators/` — Strategy pattern via `createTranslator(serviceName)`: Google (free, built-in), Baidu, DeepL.
- `api/` — Low-level HTTP calls for each service.

Config: `src/script/setting.ts` reads `automatically-i18n-config.json` from workspace root. Cached in memory; `readConfig(initConfigFile, clearCache)` controls initialization.

Key generation: either component-path-based (`ComponentName-uuid-index`) or MD5-based (same text → same key, configurable via `useMd5Key`).

Utils: `src/utils/index.ts` — `getRootPath()`, `saveObjectToPath()`, `generateUniqueId()`.

Build: `scripts/esbuild.js` bundles to `dist/extension.js` (CJS, node20, minified). Babel deps are inlined; Prettier is externalized so it resolves user project config at runtime.

## Key Conventions

- All source is TypeScript (`import`/`export`), bundled by esbuild to a single CJS file. Type checking via `tsc --noEmit`.
- Tests use Vitest (`vitest run`). Test files: `tests/unit/*.test.ts`.
- Config file lives at workspace root: `automatically-i18n-config.json`.
- Locale files go to `{i18nFilePath}/locale/{lang}.json` (default: `src/i18n/locale/`).
- The `@babel/traverse` export is resolved defensively at runtime (multiple fallback paths via `require()`) due to CJS/ESM interop issues after bundling.
- Prettier is intentionally externalized from the bundle to preserve user config file resolution.
- Shared types are centralized in `src/types.ts`.
