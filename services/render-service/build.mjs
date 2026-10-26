// Bundles src/server.ts (and the shared bot code from ../../src) into dist/server.js.
//
// Packages stay external and are installed in the image from this package.json. The check at the end is what keeps
// that safe: if the shared code ever starts importing a package this service does not list (for example next, or
// @sentry/nextjs), the build fails HERE instead of the container crashing with "Cannot find module" on Render.
import { builtinModules } from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const declared = new Set(Object.keys(pkg.dependencies));
const builtins = new Set(builtinModules);

const result = await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  packages: 'external',
  alias: { '@': '../../src' },
  sourcemap: true,
  metafile: true,
  logLevel: 'info',
});

const packageName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
const used = new Set();
for (const output of Object.values(result.metafile.outputs)) {
  for (const imp of output.imports) {
    if (!imp.external || imp.path.startsWith('node:') || builtins.has(imp.path)) continue;
    used.add(packageName(imp.path));
  }
}
// puppeteer-core is loaded by a variable name at runtime, so it cannot show up above.
used.add('puppeteer-core');

const missing = [...used].filter((name) => !declared.has(name));
if (missing.length > 0) {
  console.error(`\nBuild failed: the bundle imports packages that are not in services/render-service/package.json dependencies:\n  ${missing.join('\n  ')}\n`);
  process.exit(1);
}
console.log(`Bundle OK. Runtime packages: ${[...used].sort().join(', ')}`);
