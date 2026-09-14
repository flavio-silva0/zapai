const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../../..');
const out = path.resolve(__dirname, '../evidence');
fs.mkdirSync(out, {recursive:true});
(async()=>{
 const {default:puppeteer} = await import(pathToFileURL(path.join(root,'frontend/node_modules/puppeteer/lib/puppeteer/puppeteer.js')));
 const browser=await puppeteer.launch({headless:true,executablePath:path.join(process.env.USERPROFILE,'.cache/puppeteer/chrome/win64-151.0.7922.47/chrome-win64/chrome.exe')});
 const results=[];
 const local=process.argv.includes('--local');
 const base=local?'http://127.0.0.1:5173':'https://zapai-iota.vercel.app';
 const routes=local?['/','/sobre','/planos','/privacidade','/login','/cadastro','/painel','/painel/chat','/painel/kanban','/painel/test','/painel/perfil','/painel/ia','/painel/treinamento','/painel/canais','/painel/analytics','/painel/configuracoes','/admin','/nao-existe-auditoria']:['/','/sobre','/planos','/privacidade','/login','/cadastro','/painel','/robots.txt','/sitemap.xml'];
 for(const width of (local?[360,390,768,1024,1440]:[390,1440])){
  for(const route of routes){
   const page=await browser.newPage(); const errors=[],failed=[],http=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
   page.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});
   await page.setViewport({width,height:1000,deviceScaleFactor:1});
   if(local && process.argv.includes('--auth') && (route.startsWith('/painel')||route==='/admin')){
     const credentials=route==='/admin'?{email:'admin@zapai.local',password:'ZapAI-local-2026!'}:{email:'demo@zapai.local',password:'ZapAI-local-2026!'};
     const response=await fetch('http://127.0.0.1:3001/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});
     const data=await response.json(); if(!data.token)throw Error('Local login failed');
     await page.evaluateOnNewDocument(t=>localStorage.setItem('sofia_token',t),data.token);
   }
   try{
    const response=await page.goto(base+route,{waitUntil:'networkidle2',timeout:30000});
    await new Promise(r=>setTimeout(r,350));
    const state=await page.evaluate(()=>({title:document.title,url:location.href,body:document.body.innerText.slice(0,20000),overflow:document.documentElement.scrollWidth>innerWidth,scrollWidth:document.documentElement.scrollWidth,links:[...document.querySelectorAll('a')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})),images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,alt:i.alt})),unlabelled:[...document.querySelectorAll('input,textarea,select')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>({tag:e.tagName,type:e.type,placeholder:e.placeholder}))}));
    const slug=(route==='/'?'home':route.slice(1).replaceAll('/','-'));
    if(!route.endsWith('.txt')&&!route.endsWith('.xml'))await page.screenshot({path:path.join(out,`${local?'local':'production'}-${slug}-${width}.png`),fullPage:true});
    results.push({route,width,status:response.status(),headers:response.headers(),...state,errors,failed,http});
   }catch(e){results.push({route,width,error:e.message,errors,failed,http});}
   await page.close();
  }
  fs.writeFileSync(path.join(out,`${local?'local':'production'}-browser.json`),JSON.stringify(results,null,2));
  console.log('Reviewed',base,width,results.length,'pages');
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
