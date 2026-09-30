const puppeteer = require('../frontend/node_modules/puppeteer');
const fs = require('fs');
(async () => {
 const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page = await browser.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',r=> {
  if(r.url().includes('/api/auth/register')) return r.respond({status:202,contentType:'application/json',body:JSON.stringify({requiresConfirmation:true})});
  if(r.url().includes('/api/auth/')) return r.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Configuração pendente.'})});
  r.continue();
 });
 fs.mkdirSync('docs/qa-registration',{recursive:true});
 for (const width of [1440,390]) {
  await page.setViewport({width,height:1000}); await page.goto('http://127.0.0.1:5175/cadastro',{waitUntil:'networkidle0'});
  await page.waitForSelector('#reg-cpf');
  await page.screenshot({path:`docs/qa-registration/step-1-${width}.png`,fullPage:true});
  if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow '+width);
  const fill=async(id,value)=>{await page.click('#reg-'+id);await page.type('#reg-'+id,value);};
  await fill('nome','Pessoa Teste'); await fill('cpf','11111111111'); await fill('phone','11999999999');
  // Date inputs need the native setter to update React.
  await page.$eval('#reg-birthDate',el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'1990-01-01');el.dispatchEvent(new Event('input',{bubbles:true}));});
  await fill('email','test@example.com'); await fill('password','Password123!'); await fill('confirmPassword','Password123!');
  await page.click('button[type=submit]'); await page.waitForSelector('[role=alert]');
  if(!(await page.$eval('[role=alert]',el=>el.textContent)).includes('CPF')) throw new Error('Invalid CPF not rejected');
  await page.click('#reg-cpf'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.type('#reg-cpf','52998224725');
  await page.click('button[type=submit]'); await page.waitForSelector('#reg-cep');
  await page.screenshot({path:`docs/qa-registration/step-2-${width}.png`,fullPage:true});
  for(const [id,value] of Object.entries({cep:'01001000',number:'1',street:'Praça Teste',district:'Centro',city:'São Paulo'})) await fill(id,value);
  await page.select('#reg-state','SP'); await page.click('button[type=submit]'); await page.waitForSelector('#reg-businessName');
  await fill('businessName','Empresa Teste');await page.select('#reg-nicho','servicos');await page.click('input[type=checkbox]');
  await page.screenshot({path:`docs/qa-registration/step-3-${width}.png`,fullPage:true});
  await page.click('button[type=submit]'); await page.waitForFunction(()=>document.body.textContent.includes('Confira seu e-mail'));
  await page.screenshot({path:`docs/qa-registration/confirmation-${width}.png`,fullPage:true});
  if(await page.evaluate(()=>localStorage.getItem('sofia_token'))) throw new Error('Unconfirmed session created');
 }
 if(errors.length) throw new Error(errors.join('\n'));
 await browser.close(); console.log('UI passed at 1440px and 390px: all steps, invalid CPF, email confirmation, no premature session, no overflow or JS errors. API response simulated; no emails sent.');
})().catch(e=>{console.error(e);process.exit(1)});
