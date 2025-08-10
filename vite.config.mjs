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
        // 直接外部化 prettier，避免其 ESM 依赖的 node 内置被浏览器化
        'prettier',
      ],
      plugins: [
        nodeResolve({ preferBuiltins: true, extensions: ['.js', '.json'] }),
        commonjs({ ignoreDynamicRequires: true }),
      ],
      output: { exports: 'named' },
    },
  },
});
