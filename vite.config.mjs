import { defineConfig } from 'vite';
import commonjsPkg from '@rollup/plugin-commonjs';
import nodeResolvePkg from '@rollup/plugin-node-resolve';
// 兼容不同导出形式
const commonjs =
  typeof commonjsPkg === 'function' ? commonjsPkg : commonjsPkg.default;
const nodeResolve =
  typeof nodeResolvePkg === 'function'
    ? nodeResolvePkg
    : nodeResolvePkg.default;

// VS Code 扩展运行在 Node.js 环境，使用 CJS 格式输出
export default defineConfig({
  publicDir: false,
  build: {
    target: 'node20',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    lib: {
      entry: 'src/extension.js',
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      // 外部化 VS Code API、Node 内置模块及容易触发浏览器外部化冲突的依赖
      external: [
        'vscode',
        // node builtins
        'fs',
        'fs/promises',
        'path',
        'os',
        'module',
        'url',
        'process',
        'tty',
        'assert',
        'v8',
        'util',
        'stream',
        'http',
        'https',
        'zlib',
        // 直接外部化 prettier（其 ESM 依赖 Node 内置，打包容易报错）
        'prettier',
        // 注意：不要外部化 Babel 与 Vue 编译器，以避免生成 ?commonjs-external 标识符
      ],
      plugins: [
        nodeResolve({ preferBuiltins: true, extensions: ['.js', '.json'] }),
        commonjs({
          ignoreDynamicRequires: true,
          // 关键：让 require('cjs') 返回其 default 导出，避免得到包装命名空间对象
          requireReturnsDefault: 'preferred',
        }),
      ],
      output: { exports: 'named' },
    },
  },
});
