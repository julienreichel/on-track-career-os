#!/usr/bin/env node
/**
 * Local preview server that mimics AWS Amplify rewrite rules
 * This helps test the production build locally before deploying
 *
 * Usage: node scripts/serve-preview.js
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../.output/public');
const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function serveFile(res, filePath) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    console.log(err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Remove trailing slash (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // Try exact file first (for assets)
  let filePath = resolve(PUBLIC_DIR, pathname.slice(1));

  if (await fileExists(filePath)) {
    const stats = await stat(filePath);
    if (stats.isFile()) {
      return serveFile(res, filePath);
    }
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // AWS Amplify rewrite rules simulation:
  // 1. Serve prerendered routes from their exact paths
  if (pathname === '/') {
    filePath = resolve(PUBLIC_DIR, 'index.html');
    if (await fileExists(filePath)) {
      return serveFile(res, filePath);
    }
  }

  if (pathname === '/login') {
    filePath = resolve(PUBLIC_DIR, 'login.html');
    if (await fileExists(filePath)) {
      return serveFile(res, filePath);
    }
  }

  // 2. For all other routes, serve 200.html (SPA fallback)
  // This prevents landing page middleware from running on client-only routes
  filePath = resolve(PUBLIC_DIR, '200.html');
  if (await fileExists(filePath)) {
    console.log(`  → Serving 200.html (SPA fallback)`);
    return serveFile(res, filePath);
  }

  // Fallback to index.html if 200.html doesn't exist
  filePath = resolve(PUBLIC_DIR, 'index.html');
  if (await fileExists(filePath)) {
    console.log(`  → Serving index.html (fallback)`);
    return serveFile(res, filePath);
  }

  // 404 if nothing found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`
🚀 Preview server running at http://localhost:${PORT}

This server mimics AWS Amplify rewrite rules:
  / → index.html (prerendered landing)
  /login → login.html (prerendered)
  /** → 200.html (SPA fallback for client-only routes)

To test:
1. Open http://localhost:${PORT}
2. Sign in and navigate to /profile or /home
3. Reload the page - check if you get redirected to /home

Press Ctrl+C to stop
`);
});
