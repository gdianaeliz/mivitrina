import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Lee .env del mismo folder que server.mjs → process.env solo para esas claves al arrancar */
function applyDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

applyDotEnv();

const PORT = Number(process.env.PORT) || 8080;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function sendConfig(res) {
  const body = `window.SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};
window.SUPABASE_ANON_KEY = ${JSON.stringify(SUPABASE_ANON_KEY)};
`;
  res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  res.end(body);
}

function safePath(urlPath) {
  const relative = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(root, normalized);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

  if (url.pathname === '/supabase-config.js') {
    sendConfig(res);
    return;
  }

  let filePath = safePath(url.pathname === '/' ? '/mi-vitrina.html' : url.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Aviso: define SUPABASE_URL y SUPABASE_ANON_KEY en .env');
  }
  console.log(`Vitrina: http://127.0.0.1:${PORT}/mi-vitrina.html`);
});
