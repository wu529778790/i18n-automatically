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
      external: ['vscode', 'fs', 'path', 'os', 'module'],
      plugins: [
        nodeResolve({ preferBuiltins: true, extensions: ['.js', '.json'] }),
        commonjs({ ignoreDynamicRequires: true }),
      ],
      output: { exports: 'auto' },
    },
  },
});
