import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = {'/':'index.html','/app.js':'app.js','/model.js':'model.js','/style.css':'style.css'};
const types = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
http.createServer(async (req,res) => {
  const file = files[new URL(req.url,'http://localhost').pathname];
  if (!file) { res.writeHead(404); res.end('Não encontrado'); return; }
  try { const body = await readFile(new URL(file,import.meta.url)); res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-cache'}); res.end(body); }
  catch { res.writeHead(500); res.end('Erro ao ler arquivo'); }
}).listen(3000,'0.0.0.0',()=>console.log('Treinos: http://localhost:3000'));
