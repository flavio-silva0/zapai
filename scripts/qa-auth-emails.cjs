"use strict";
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const puppeteer = require('../frontend/node_modules/puppeteer');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const report = [];
  try {
    const page = await browser.newPage();
    const failures = []; page.on('pageerror', e => failures.push(e.message));
    for (const kind of ['confirmation','recovery']) {
      const source = fs.readFileSync(path.join(root,'templates/auth',kind+'.html'),'utf8');
      assert.ok(source.includes('href="{{ .ConfirmationURL }}"'));
      assert.ok(!/<script|data:image|localhost/i.test(source));
      for (const width of [760,390]) {
        await page.setViewport({ width, height: 1000 });
        await page.goto(pathToFileURL(path.join(root,'templates/auth',kind+'-preview.html')).href, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const session = await page.createCDPSession();
        await session.send('DOM.enable');
        await session.send('CSS.enable');
        const documentNode = await session.send('DOM.getDocument');
        const headingNode = await session.send('DOM.querySelector', {nodeId: documentNode.root.nodeId, selector: 'h2'});
        const renderedFonts = await session.send('CSS.getPlatformFontsForNode', {nodeId: headingNode.nodeId});
        assert.ok(renderedFonts.fonts.some(font => font.isCustomFont && font.postScriptName === 'Inter-Bold'));
        assert.equal(await page.$eval('h2', el => getComputedStyle(el).fontWeight), '700');
        await session.detach();
        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, logoLoaded: [...document.images].every(img => img.complete && img.naturalWidth > 0), hasHeading: Boolean(document.querySelector('h1')), interLoaded: [...document.fonts].some(f => f.family.includes('Inter') && f.status === 'loaded'), cta: [...document.querySelectorAll('a')].filter(a => a.textContent.includes('→')).length }));
        assert.equal(state.interLoaded,true); assert.equal(state.overflow,false); assert.equal(state.logoLoaded,true); assert.equal(state.hasHeading,true); assert.equal(state.cta,1);
        await page.screenshot({ path: path.join(root,`docs/qa-registration/email-${kind}-${width}.png`), fullPage: true });
        report.push({ kind, width, ...state, headingFonts: renderedFonts.fonts });
      }
      // Match Studio's srcDoc preview, including its opaque sandbox origin.
      await page.setContent('<iframe title="studio-preview" sandbox="allow-scripts allow-forms" style="width:100%;height:900px;border:0"></iframe>');
      await page.$eval('iframe', (iframe, html) => {
        iframe.srcdoc = html.replace(/<head([^>]*)>/i, '<head$1><style>html{background:white}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}</style>');
      }, source);
      const iframe = await page.$('iframe');
      const frame = await iframe.contentFrame();
      await frame.waitForSelector('h1');
      await frame.evaluate(() => document.fonts.ready);
      const sandboxInterLoaded = await frame.evaluate(() => [...document.fonts].some(f => f.family.includes('Inter') && f.status === 'loaded'));
      assert.equal(sandboxInterLoaded, true, 'Inter must load in the Studio-style sandbox');
      report.push({kind, studioStyleSandbox: true, interLoaded: sandboxInterLoaded});
      // Essential information, brand image and action remain readable without CSS head rules.
      await page.setViewport({ width: 760, height: 1000 });
      await page.setContent(source.replace(/<style>[\s\S]*?<\/style>/,'').replaceAll('{{ .ConfirmationURL }}','https://example.com/confirmar'),{waitUntil:'load'});
      assert.ok(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
    }
    assert.equal(failures.length,0);
    fs.writeFileSync(path.join(root,'docs/qa-registration/email-visual-qa.json'),JSON.stringify({checks:report,jsErrors:failures,emailClientDeliveryTested:false},null,2));
    console.log('Email QA passed: desktop/mobile, official logo loaded, no overflow, one main CTA, valid confirmation placeholders, inline-style fallback.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
