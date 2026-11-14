import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
const server=createServer(async(request,response)=>{
 try{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){response.writeHead(403);response.end('Forbidden');return;}
  const info=await stat(file).catch(()=>null);
  if(!info?.isFile())file=resolve(root,'index.html');
  const content=await readFile(file);
  response.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'no-store'});
  response.end(content);
 }catch{response.writeHead(500);response.end('Preview not built. Run npm run build first.');}
});
export { server };
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`TD Nihongo Hub preview: http://127.0.0.1:${port}\nOpen Student login to try the student or teacher preview.\nPress Ctrl+C to stop.`));
