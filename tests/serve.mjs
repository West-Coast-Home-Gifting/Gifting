// Tiny static server with gzip + long-cache headers, so Lighthouse sees production-like transfer sizes.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
const root = path.resolve('dist')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' }
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  const ext = path.extname(f)
  const buf = fs.readFileSync(f)
  const h = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': p.startsWith('/assets/') || ext === '.woff2' ? 'public,max-age=31536000,immutable' : 'no-cache' }
  if (['.html', '.js', '.css', '.json', '.svg'].includes(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) { h['Content-Encoding'] = 'gzip'; res.writeHead(200, h); return res.end(zlib.gzipSync(buf, { level: 9 })) }
  res.writeHead(200, h); res.end(buf)
}).listen(4174, '127.0.0.1', () => console.log('serving dist on 4174'))
