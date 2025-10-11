module.exports = async function handler(req, res) {
  // Emit immediate invocation info.
  try { console.error('[debug] fetch-ical invoked', { method: req.method, url: req.url, query: req.query && Object.keys(req.query) }); } catch (e) {}

  // Normalize and safely extract the 'url' param. It may be:
  // - req.query.url as a string
  // - req.query.url as an array (from repeated params)
  // - missing and present in the raw req.url's search params
  let rawParam = undefined
  try {
    if (req.query && req.query.url) {
      // If Express parsed as array, take first element
      rawParam = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
    } else if (req.url) {
      // Try to parse from the raw request URL
      try {
        const parsed = new URL(req.url, `http://${req.headers.host}`)
        rawParam = parsed.searchParams.get('url')
      } catch (e) {
        // fall through
      }
    }
  } catch (e) {
    try { console.error('[fetch-ical] error reading param', e && e.stack ? e.stack : String(e)) } catch (e) {}
  }

  if (!rawParam) {
    res.status(400).send('Missing url param')
    return
  }

  // Percent-decoding may be required if callers double-encode the url.
  let decoded = String(rawParam)
  try {
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) decoded = decodeURIComponent(decoded)
  } catch (e) {
    try { console.error('[fetch-ical] decodeURIComponent failed', e && e.stack ? e.stack : String(e)) } catch (e) {}
    // keep original if decode fails
  }

  // Convert webcal: to https: when present.
  const fetchUrl = decoded.replace(/^webcal:/i, 'https:')

  try { console.error('[fetch-ical] urls', { rawParam, decoded, fetchUrl }) } catch (e) {}

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    'Accept': 'text/calendar, */*;q=0.1',
    'Referer': 'https://www.icloud.com/'
  }

  try {
    try { console.error('[fetch-ical] fetching', fetchUrl) } catch (e) {}
    const upstream = await fetch(fetchUrl, { headers, redirect: 'follow' })
    try { console.error('[fetch-ical] upstream status', { status: upstream.status, url: fetchUrl }) } catch (e) {}
    if (!upstream.ok) {
      const body = await upstream.text().catch(() => '')
      try { console.error('[fetch-ical] upstream non-ok body', { status: upstream.status, body: body && body.slice ? body.slice(0, 200) : String(body) }) } catch (e) {}
      return res.status(502).send('Upstream error')
    }
    const text = await upstream.text()
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('X-Debug-Invoked', 'fetch-ical')
    res.send(text)
    return
  } catch (err) {
    try { console.error('[fetch-ical] fetch exception', err && err.stack ? err.stack : String(err), { fetchUrl, rawParam }) } catch (e) {}
    res.status(500).send('fetch failed')
    return
  }
}
