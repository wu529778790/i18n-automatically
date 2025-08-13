/* eslint-disable no-console */
const esbuild = require('esbuild');
const path = require('path');

async function bundleExtension() {
  try {
    const optionalTemplateEngines = [
      'velocityjs',
      'dustjs-linkedin',
      'atpl',
      'liquor',
      'twig',
      'ejs',
      'eco',
      'jazz',
      'jqtpl',
      'hamljs',
      'hamlet',
      'whiskers',
      'haml-coffee',
      'hogan.js',
      'templayed',
      'handlebars',
      'underscore',
      'lodash',
      'walrus',
      'mustache',
      'just',
      'ect',
      'mote',
      'toffee',
      'dot',
      'bracket-template',
      'ractive',
      'htmling',
      'babel-core',
      'plates',
      'react-dom/server',
      'react',
      'vash',
      'slm',
      'marko',
      'teacup/lib/express',
      'coffee-script',
      'squirrelly',
      'twing',
      'consolidate',
    ];

    // 重要：Babel 相关依赖不要 external，否则运行时会引用到宿主/用户环境中的其他版本，
    // 容易出现 path.hub.buildError 之类的版本错配错误。

    await esbuild.build({
      entryPoints: [path.resolve(__dirname, '..', 'src', 'extension.js')],
      outfile: path.resolve(__dirname, '..', 'dist', 'extension.js'),
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'cjs',
      sourcemap: false,
      minify: true,
      external: ['vscode', 'prettier', ...optionalTemplateEngines],
      logLevel: 'info',
    });
    console.log('✅ esbuild 打包完成: dist/extension.js');
  } catch (err) {
    console.error('❌ esbuild 打包失败');
    console.error(err);
    process.exit(1);
  }
}

bundleExtension();
