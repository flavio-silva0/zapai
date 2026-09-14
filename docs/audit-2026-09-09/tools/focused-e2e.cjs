const fs=require('fs'),path=require('path'),assert=require('assert');const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(__dirname,'../evidence');
(async()=>{
 const {default:puppeteer}=await import(pathToFileURL(path.join(root,'frontend/node_modules/puppeteer/lib/puppeteer/puppeteer.js')));
 const browser=await puppeteer.launch({headless:true,executablePath:path.join(process.env.USERPROFILE,'.cache/puppeteer/chrome/win64-151.0.7922.47/chrome-win64/chrome.exe')});
 const results=[];const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
 const goto=async p=>{await page.goto('http://127.0.0.1:5173'+p,{waitUntil:'networkidle2'});await new Promise(r=>setTimeout(r,250))};
 const click=async text=>{const ok=await page.evaluate(t=>{const e=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().includes(t));if(!e)return false;e.click();return true},text);assert(ok,'Button '+text)};
 const login=async email=>{await goto('/login');await page.type('#login-email',email);await page.type('#login-password','ZapAI-local-2026!');await page.click('button[type="submit"]');await page.waitForFunction(()=>location.pathname.startsWith('/painel'));await new Promise(r=>setTimeout(r,400))};
 try{
  await goto('/painel/ia');assert(new URL(page.url()).pathname==='/login');results.push({case:'anonymous protected route',result:'redirect login'});
  await login('demo@zapai.local');results.push({case:'real login through UI',result:'passed'});
  await goto('/painel/ia');
  await page.$eval('input[type="range"]',el=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(el,'12');el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))});
  const changed=await page.$eval('input[type="range"]',e=>e.value);await page.reload({waitUntil:'networkidle2'});const reloaded=await page.$eval('input[type="range"]',e=>e.value);results.push({case:'personality slider reload',before:changed,after:reloaded,defect:changed!==reloaded});
  await click('Diretrizes Avançadas');await click('Editar Diretrizes Manualmente');await page.waitForSelector('textarea');
  const previous=await page.$eval('textarea',e=>e.value);const marker='Demonstração local ZapAI — configuração persistida pela auditoria.';
  await page.$eval('textarea',(e,v)=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}))},marker);
  await click('Salvar Diretrizes');await new Promise(r=>setTimeout(r,400));await page.reload({waitUntil:'networkidle2'});await click('Diretrizes Avançadas');assert((await page.$eval('body',e=>e.innerText)).includes(marker));results.push({case:'IA edit save reload through UI',result:'passed'});
  await page.screenshot({path:path.join(out,'e2e-ai-saved.png')});
  const token=await page.evaluate(()=>localStorage.getItem('sofia_token'));await fetch('http://127.0.0.1:3001/api/admin/magic-setup/save',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({prompt_text:previous})});
  await goto('/painel/test');await page.evaluate(()=>localStorage.setItem('sandbox_history',JSON.stringify([{role:'user',texto:'CANARIO_PRIVADO_EMPRESA_A'}])));await page.reload({waitUntil:'networkidle2'});await click('Sair do Painel');await page.waitForFunction(()=>location.pathname==='/login');results.push({case:'logout protected route',result:'redirect login'});
  await login('empresa-b@zapai.local');await goto('/painel/test');const leaked=(await page.$eval('body',e=>e.innerText)).includes('CANARIO_PRIVADO_EMPRESA_A');results.push({case:'sandbox account switch',leakedTenantAHistory:leaked});await page.screenshot({path:path.join(out,'e2e-sandbox-cross-account.png')});
  await page.evaluate(()=>localStorage.removeItem('sandbox_history'));
  await goto('/painel/chat');await page.setViewport({width:360,height:800});const contact=await page.$('aside button');if(contact)await contact.click();await page.screenshot({path:path.join(out,'e2e-chat-mobile.png')});
 }finally{fs.writeFileSync(path.join(out,'focused-e2e.json'),JSON.stringify(results,null,2));await browser.close()}
 console.log(results);
})().catch(e=>{console.error(e);process.exit(1)});
