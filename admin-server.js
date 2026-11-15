#!/usr/bin/env node
/* =====================================================================
   INVENTORY — local admin server (no dependencies)
   Run:  npm run admin   (or: node admin-server.js)
   Then: http://localhost:4173/admin.html

   - Serves the site from this folder, bound to 127.0.0.1 only.
   - Password lives in admin.config.json (created on first run).
   - "Save" in the admin panel writes assets/data/content.js and keeps
     a timestamped backup in assets/data/backups/.
   ===================================================================== */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 4173;
const CONFIG = path.join(ROOT, 'admin.config.json');
const CONTENT = path.join(ROOT, 'assets', 'data', 'content.js');
const BACKUPS = path.join(ROOT, 'assets', 'data', 'backups');
const MAX_BODY = 5 * 1024 * 1024;

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch (e) {}
  const cfg = { password: crypto.randomBytes(9).toString('base64url') };
  fs.writeFileSync(CONFIG, JSON.stringify(cfg, null, 2));
  console.log('\n  admin.config.json created. Change the password in that file if you like.');
  return cfg;
}
const config = loadConfig();
if (!config.password || String(config.password).length < 6) {
  console.error('"password" in admin.config.json must be at least 6 characters.');
  process.exit(1);
}

const sessions = new Map();          // token -> expiry
const SESSION_MS = 8 * 60 * 60 * 1000;
let failures = 0, lockedUntil = 0;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function authed(req) {
  const tok = req.headers['x-admin-token'];
  const exp = tok && sessions.get(tok);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(tok); return false; }
  return true;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function validContent(c) {
  return c && typeof c === 'object' && !Array.isArray(c) && c.profile && Array.isArray(c.projects) && Array.isArray(c.games);
}

async function api(req, res, route) {
  // Only accept API calls from pages served by this server
  const origin = req.headers.origin;
  if (req.method === 'POST' && origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return send(res, 403, { error: 'origin' });

  if (route === '/api/status' && req.method === 'GET') return send(res, 200, { server: true, authed: authed(req) });

  if (route === '/api/login' && req.method === 'POST') {
    if (Date.now() < lockedUntil) return send(res, 429, { error: 'locked', retry: Math.ceil((lockedUntil - Date.now()) / 1000) });
    let body; try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'body' }); }
    if (!safeEqual(body.password || '', config.password)) {
      failures++;
      if (failures >= 5) { lockedUntil = Date.now() + 5 * 60 * 1000; failures = 0; }
      return send(res, 401, { error: 'password' });
    }
    failures = 0;
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { token });
  }

  if (route === '/api/save' && req.method === 'POST') {
    if (!authed(req)) return send(res, 401, { error: 'auth' });
    let body; try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'body' }); }
    const c = body.content;
    if (!validContent(c)) return send(res, 400, { error: 'invalid content' });
    c.updated = new Date().toLocaleDateString('sv-SE');
    const js = '/* INVENTORY — site content. Edited by admin.html; safe to edit by hand too.\n   "text" overrides any i18n key (see admin → All texts). */\n' +
      'window.SITE_CONTENT = ' + JSON.stringify(c, null, 2).replace(/<\/script/gi, '<\\/script') + ';\n';
    fs.mkdirSync(BACKUPS, { recursive: true });
    if (fs.existsSync(CONTENT)) fs.copyFileSync(CONTENT, path.join(BACKUPS, 'content-' + new Date().toISOString().replace(/[:.]/g, '-') + '.js'));
    const tmp = CONTENT + '.tmp';
    fs.writeFileSync(tmp, js);
    fs.renameSync(tmp, CONTENT);
    // keep the 30 newest backups
    const old = fs.readdirSync(BACKUPS).filter((f) => f.startsWith('content-')).sort().reverse().slice(30);
    old.forEach((f) => fs.unlinkSync(path.join(BACKUPS, f)));
    console.log('  [' + new Date().toLocaleTimeString() + '] content saved');
    return send(res, 200, { ok: true, updated: c.updated });
  }

  if (route === '/api/logout' && req.method === 'POST') {
    sessions.delete(req.headers['x-admin-token']);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'not found' });
}

function serveStatic(req, res, route) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  let rel = decodeURIComponent(route);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const relCheck = path.relative(ROOT, file);
  if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) return send(res, 403, 'Forbidden', 'text/plain');
  // never serve secrets, backups or hidden files
  if (/(^|[\\/])\./.test(relCheck) || /^admin\.config\.json$/i.test(relCheck) || /backups/i.test(relCheck) || /node_modules/i.test(relCheck)) return send(res, 404, 'Not found', 'text/plain');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  let route;
  try { route = new URL(req.url, 'http://localhost').pathname; } catch (e) { return send(res, 400, 'Bad request', 'text/plain'); }
  if (route.startsWith('/api/')) return api(req, res, route).catch((e) => { console.error(e); send(res, 500, { error: 'server' }); });
  serveStatic(req, res, route);
}).listen(PORT, '127.0.0.1', () => {
  console.log('\n  INVENTORY admin server running');
  console.log('  Site : http://localhost:' + PORT + '/index.html');
  console.log('  Admin: http://localhost:' + PORT + '/admin.html');
  console.log('  Password: admin.config.json → "password"\n');
});
