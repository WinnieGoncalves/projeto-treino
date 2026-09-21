// Run with: node test-browser.js (Chrome or Edge installed; no dependencies).
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {once} from 'node:events';

const executable=process.env.CHROME_PATH||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
assert.ok(executable,'Set CHROME_PATH to a Chrome/Chromium executable.');
const profile=await mkdtemp(join(tmpdir(),'treino-browser-'));
assert.equal(dirname(resolve(profile)),resolve(tmpdir()));
const server=createServer(async(req,res)=>{
 const file={'/':'index.html','/app.js':'app.js','/model.js':'model.js','/style.css':'style.css'}[req.url];
 if(!file){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
 res.end(await readFile(new URL(file,import.meta.url)));
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const browser=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let socket;
try{
 const endpoint=await new Promise((resolve,reject)=>{
  let output='';const timeout=setTimeout(()=>reject(Error('Browser startup timed out')),20000);
  browser.on('error',reject);browser.stderr.on('data',chunk=>{output+=chunk;const match=output.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
 });
 console.log('Browser started.');
 socket=new WebSocket(endpoint);await once(socket,'open');
 let sequence=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++sequence;const timeout=setTimeout(()=>reject(Error(`Timed out: ${method}`)),10000);pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});socket.send(JSON.stringify({id,method,params,sessionId}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const call=(method,params)=>send(method,params,sessionId);
 await call('Runtime.enable');
 const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text+': '+result.result.description);return result.result.value;};
 const ready=()=>evaluate(`new Promise((resolve,reject)=>{let tries=0;const t=setInterval(()=>{if(document.querySelector('[data-add]')){clearInterval(t);resolve(true);}else if(++tries>100){clearInterval(t);reject(Error('App did not render'));}},20);})`);
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const html=()=>evaluate('document.querySelector("#app").innerHTML');
 const saved=()=>evaluate('JSON.parse(localStorage.getItem("meus-treinos-v1"))');
 const form=async(name,load,reps)=>evaluate(`(()=>{const f=document.querySelector('dialog form');f.elements.name.value=${JSON.stringify(name)};f.elements.load0.value=${JSON.stringify(load)};f.elements.reps.value=${JSON.stringify(reps)};f.requestSubmit();})()`);
 const reload=async()=>{await call('Page.reload');await ready();};
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});await ready();
 await click('[data-day="seg"]');await click('[data-manage="seg:ext"]');
 assert.equal(await evaluate('document.querySelector("dialog").open'),true);
 assert.equal(await evaluate('document.activeElement.name'),'name');
 assert.equal(await evaluate('document.querySelector("dialog").getBoundingClientRect().width<=innerWidth'),true);
 await form('Extensora personalizada','75','3x12');
 let s=await saved();assert.equal(s.customExercises.ext.name,'Extensora personalizada');assert.deepEqual(s.history.ext.map(h=>h.loads[0]),[70,75]);
 await reload();await click('[data-day="seg"]');assert.match(await html(),/Extensora personalizada/);assert.match(await html(),/3x12/);
 await click('[data-day="qui"]');await click('[data-add="qui"]');await form('Hack Squat','50','4x10');
 s=await saved();const id=Object.keys(s.customExercises).find(id=>id.startsWith('exercise_'));assert.ok(id);
 for(const day of ['seg','ter','qua','qui','sex','sab']){await click(`[data-day="${day}"]`);assert.equal((await html()).includes(`data-manage="${day}:${id}"`),day==='qui');}
 await reload();await click('[data-day="qui"]');assert.match(await html(),/Hack Squat/);
 await click(`[data-toggle="qui:${id}"]`);
 assert.equal(await evaluate(`document.querySelector('[data-exercise-row="qui:${id}"]').classList.contains('exercise-done')`),true);
 assert.match(await evaluate(`getComputedStyle(document.querySelector('[data-exercise-row="qui:${id}"]')).boxShadow`),/rgb\(0, 255, 127\)/);
 await click(`[data-toggle="qui:${id}"]`);assert.equal(await evaluate(`document.querySelector('[data-exercise-row="qui:${id}"]').classList.contains('exercise-done')`),false);
 await click(`[data-edit="qui:${id}"]`);await evaluate(`(()=>{const f=document.querySelector('.editor');f.elements.load0.value='55';f.requestSubmit();})()`);
 assert.deepEqual((await saved()).history[id].map(h=>h.loads[0]),[50,55]);
 await click(`[data-manage="qui:${id}"]`);await click('[data-delete]');assert.match(await evaluate('document.querySelector(".delete-confirm p").textContent'),/quinta-feira/);
 await click('[data-keep]');assert.ok((await saved()).customWorkouts.qui.items.includes(id));
 await click('[data-delete]');await click('[data-confirm]');await reload();await click('[data-day="qui"]');assert.doesNotMatch(await html(),/Hack Squat/);
 await click('[data-day="seg"]');await click('[data-manage="seg:ext"]');await click('[data-delete]');await click('[data-confirm]');await reload();await click('[data-day="seg"]');assert.doesNotMatch(await html(),/data-manage="seg:ext"/);
 await click('#progress-tab');await evaluate(`(()=>{const s=document.querySelector('#exercise-select');s.value=${JSON.stringify(id)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 assert.match(await html(),/Hack Squat/);assert.match(await html(),/55 kg/);assert.match(await html(),/<svg/);
 await click('#training-tab');await click('[data-add="seg"]');
 for(const width of [320,390,768,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`No horizontal overflow at ${width}px`);
  assert.equal(await evaluate('document.querySelector("dialog").getBoundingClientRect().right<=innerWidth'),true);
 }
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 if(process.env.SCREENSHOT_PATH){const {data}=await call('Page.captureScreenshot',{format:'png'});await writeFile(process.env.SCREENSHOT_PATH,Buffer.from(data,'base64'));}
 assert.deepEqual(errors,[]);
 console.log('Browser checks passed: CRUD, reload, day isolation, confirmation/cancel, FEITO #00FF7F, DESFAZER, inline load, history/progression, mobile 320/390px and desktop.');
}finally{
 socket?.close();browser.kill();server.close();
 // Only the temporary profile created by this test is removed.
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
