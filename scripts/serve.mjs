// Local preview only; this is a static file server, not the CMS backend.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve,relative,extname,sep } from 'node:path';
const root=process.cwd();
const port=Number(process.env.PORT||5500);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.mp4':'video/mp4','.xml':'application/xml'};
const folders=new Set(['assets','css','js','images','videos','data','admin','produtos']);
createServer(async(request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
  try{
    let path=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/+/, '');
    if(!path||path.endsWith('/'))path+='index.html';
    const target=resolve(root,path),local=relative(root,target);
    if(local.startsWith('..')||!types[extname(target)]||(local.includes(sep)&&!folders.has(local.split(sep)[0]))||local.split(sep).some(segment=>segment.startsWith('.')))throw Error('Unavailable');
    if(!(await stat(target)).isFile())throw Error('Unavailable');
    response.writeHead(200,{'Content-Type':types[extname(target)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(request.method==='HEAD')response.end();else createReadStream(target).on('error',()=>response.destroy()).pipe(response);
  }catch{response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Página não encontrada.');}
}).listen(port,'127.0.0.1',()=>console.log(`Prévia local: http://127.0.0.1:${port}`));
