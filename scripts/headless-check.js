#!/usr/bin/env node
const fs = require('fs');
const puppeteer = require('puppeteer');

async function run() {
  const OUT = '/tmp/headless_console.json';
  const url = process.argv[2] || 'https://life-aoy13ofo8-emilys-projects-9f8716f7.vercel.app';
  console.log('Checking', url);
  const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const logs = {console: [], errors: [], requests: [], responses: []};

  page.on('console', msg => {
    try { logs.console.push({type: msg.type(), text: msg.text(), location: msg.location()}); } catch(e){ logs.console.push({type:'unknown', text: String(msg)}); }
  });
  page.on('pageerror', err => logs.errors.push({message: err.message, stack: err.stack}));
  page.on('requestfailed', req => logs.requests.push({url: req.url(), method: req.method(), status: 'FAILED', failure: req.failure() && req.failure().errorText}));
  page.on('requestfinished', async req => {
    try {
      const res = req.response();
      if (!res) return;
      const headers = res.headers();
      const status = res.status();
      logs.responses.push({url: req.url(), status, headers});
    } catch(e) {}
  });

  // Navigate and wait
  await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000}).catch(e => logs.errors.push({message: 'goto-failed', detail: e.message}));

  // Try to call the fetch-ical endpoint from the page context (same origin) using GET and POST if available
  try {
    const base64Encode = (s) => {
      try { if (typeof window !== 'undefined' && window.btoa) return window.btoa(s) } catch (e) {}
      return Buffer.from(s).toString('base64')
    }
    const testUrl = '/api/fetch-ical?b64=' + base64Encode('https://p131-caldav.icloud.com/published/2/MjEwMDk1ODQyMjEwMDk1OAAGTcEcX0zn4rLjv-0NbqlOx5SoeTqOKOi2X9xNhJPMRqvkVBayYMk6aS3MHrIBMv8AsDzrttK6IkwycW7iXbE');
    const fetchRes = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, {method: 'GET'});
        const text = await r.text();
        return {ok: r.ok, status: r.status, length: text.length, snippet: text.slice(0,200)};
      } catch (e) { return {error: e.message}; }
    }, testUrl);
    logs.fetchTest = {endpoint: testUrl, result: fetchRes};
  } catch (e) {
    logs.fetchTest = {error: String(e)};
  }

  // give time for lazy requests
  await new Promise((res) => setTimeout(res, 1000));

  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify(logs, null, 2));
  console.log('Saved logs to', OUT);
  console.log('Summary: console messages:', logs.console.length, 'errors:', logs.errors.length, 'requests failures:', logs.requests.length);
}

run().catch(err => { console.error(err); process.exit(1); });
