import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
const MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png'};
const server=http.createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);
  const f=path.join(DIR,u==='/'?'render.html':u);
  if(!fs.existsSync(f)){res.writeHead(404);return res.end();}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(res);});
await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('PAGEERROR',String(e).split('\n')[0]));
await page.goto(`http://127.0.0.1:${server.address().port}/render.html?view=front`,{waitUntil:'load'});
await page.waitForFunction('window.__ready===true',{timeout:30000}).catch(()=>{});
const info = await page.evaluate(() => {
  const THREE = window.THREE; const m = window.makeModel({},{}); m.updateMatrixWorld(true);
  const rows=[];
  m.traverse(o=>{
    if(!o.isMesh) return;
    const sc=o.userData&&o.userData.sculptComponent;
    const b=new THREE.Box3().setFromObject(o); const s=b.getSize(new THREE.Vector3()); const c=b.getCenter(new THREE.Vector3());
    rows.push({id:sc?sc.id:'(none)', name:o.name||'', vis:o.visible,
      size:[+s.x.toFixed(4),+s.y.toFixed(4),+s.z.toFixed(4)],
      ctr:[+c.x.toFixed(3),+c.y.toFixed(3),+c.z.toFixed(3)],
      scale:[+o.scale.x.toFixed(4),+o.scale.y.toFixed(4),+o.scale.z.toFixed(4)],
      verts:o.geometry&&o.geometry.attributes.position?o.geometry.attributes.position.count:0});
  });
  return rows;
});
console.log('meshes:',info.length);
for(const r of info) console.log(`${r.id.padEnd(15)} vis=${r.vis?'Y':'n'} size=${r.size.join(',').padEnd(22)} ctr=${r.ctr.join(',').padEnd(20)} scale=${r.scale.join(',').padEnd(20)} v=${r.verts}`);
await browser.close(); server.close();
