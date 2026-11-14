// Xem thử nội dung app trong trình duyệt: node tools/serve.js  ->  http://localhost:8765
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(rootDir, rel === '/' ? 'index.html' : rel));
  if (!file.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8765, '127.0.0.1', () => console.log('http://localhost:8765'));
