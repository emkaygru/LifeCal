module.exports = async function handler(req, res) {
  // Debug: emit a small runtime log so Vercel shows the function invocation
  try {
    try { console.error('[debug] fetch-ical invoked', { method: req.method, url: req.url, query: req.query && Object.keys(req.query) }); } catch (e) { /* ignore logging errors */ }
    const url = req.query.url || req.url && new URL(req.url, `http://${req.headers.host}`).searchParams.get('url')
    if (!url) return res.status(400).send('Missing url param')

    // Support webcal: published iCloud links by converting to https:
    // URL may be percent-encoded (webcal%3A...), so decode first if needed.
    let rawUrl = url
    try {
      // If the value contains percent-encoding, decode it safely
      if (/%[0-9A-Fa-f]{2}/.test(String(rawUrl))) {
        rawUrl = decodeURIComponent(String(rawUrl))
      }
    } catch (e) {
      // ignore decode errors and keep raw value
    }
    const fetchUrl = String(rawUrl).replace(/^webcal:/i, 'https:')

    try { console.error('[fetch-ical] rawUrl/decoded/fetchUrl', { raw: url, decoded: rawUrl, fetchUrl }) } catch (e) {}

    // Use browser-like headers; some upstreams (icloud) block non-browser agents.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      'Accept': 'text/calendar, */*;q=0.1',
      'Referer': 'https://www.icloud.com/'
    }

    try {
      try { console.error('[fetch-ical] fetching', fetchUrl) } catch (e) {}
      const upstream = await fetch(fetchUrl, { headers, redirect: 'follow' })
      try { console.error('[fetch-ical] upstream status', { status: upstream.status, url: fetchUrl }) } catch (e) {}
      if (!upstream.ok) return res.status(502).send('Upstream error')
      const text = await upstream.text()

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      // Expose a small debug header so the invocation is visible via curl/browser
      res.setHeader('X-Debug-Invoked', 'fetch-ical')
      res.send(text)
    } catch (err) {
      try { console.error('[fetch-ical] error fetching', { err: err && err.stack ? err.stack : String(err), url: req.query && req.query.url }) } catch (e) {}
      res.status(500).send('fetch failed')
    }
  } catch (outerErr) {
    try { console.error('[fetch-ical] outer error', outerErr && outerErr.stack ? outerErr.stack : String(outerErr)) } catch (e) {}
    res.status(500).send('server error')
  }
}
