import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

function resetDistDirectory() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
}

async function buildEntry(format, outfile, extra = {}) {
  const { entry = 'index.js', ...rest } = extra;
  await esbuild.build({
    entryPoints: [resolve(rootDir, 'src', entry)],
    outfile: resolve(distDir, outfile),
    bundle: true,
    format,
    target: ['es2020'],
    sourcemap: true,
    minify: false,
    logLevel: 'warning',
    ...rest
  });
}

async function build() {
  resetDistDirectory();

  await buildEntry('esm', 'index.js');
  await buildEntry('cjs', 'index.cjs');
  await buildEntry('iife', 'vanduo-flowchart.iife.js', {
    globalName: 'VanduoFlowchart'
  });

  // Optional Vue 3 bindings — `vue` stays external (peer dependency).
  await buildEntry('esm', 'vue.js', { entry: 'vue.js', external: ['vue'] });
  await buildEntry('cjs', 'vue.cjs', { entry: 'vue.js', external: ['vue'] });

  copyFileSync(
    resolve(rootDir, 'src', 'styles.css'),
    resolve(distDir, 'vanduo-flowchart.css')
  );
  copyFileSync(
    resolve(rootDir, 'src', 'vue.d.ts'),
    resolve(distDir, 'vue.d.ts')
  );

  console.log('Built @vanduo-oss/flowchart dist artifacts.');
}

build();
