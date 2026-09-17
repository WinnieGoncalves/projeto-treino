import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const output=new URL('./dist/',import.meta.url);
await mkdir(output,{recursive:true});
for(const file of ['index.html','app.js','model.js','style.css']) await copyFile(new URL(file,import.meta.url),new URL(file,output));
await writeFile(new URL('.nojekyll',output),'');
console.log('Build estatico gerado em dist/ para GitHub Pages.');
