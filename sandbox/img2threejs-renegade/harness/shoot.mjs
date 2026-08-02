import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(DIR, url === '/' ? 'render.html' : url);
  if (!file.startsWith(DIR) || !fs.existsSync(file)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const views = process.argv[2] ? process.argv[2].split(',') : ['front', 'back', 'three-quarter'];
const outDir = process.argv[3] || path.join(DIR, 'renders');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

for (const view of views) {
  await page.goto(`http://127.0.0.1:${port}/render.html?view=${view}&w=800&h=1200${process.env.STRIP==='1'?'&strip=1':''}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 }).catch(() => {});
  const err = await page.evaluate('window.__error || null');
  const bbox = await page.evaluate('window.__bbox || null'); const hid = await page.evaluate('window.__hidden');
  if (err) { console.log(`${view}: MODEL_ERROR ${err.split('\n')[0]}`); continue; }
  const canvas = await page.$('canvas');
  if (!canvas) { console.log(`${view}: NO CANVAS`); continue; }
  await canvas.screenshot({ path: path.join(outDir, `${view}.png`) });
  console.log(`${view}: ok  bbox size=${bbox ? bbox.size.map(n => n.toFixed(3)).join(',') : '?'} hiddenRootMeshes=${hid}`);
}
if (errors.length) console.log('JS errors:', [...new Set(errors)].slice(0, 5).join(' | '));
await browser.close();
server.close();
