module.exports = async function handler(req, res) {
  // Debug: emit a small runtime log so Vercel shows the function invocation
  try {
    try { console.error('[debug] fetch-ical invoked', { method: req.method, url: req.url, query: req.query && Object.keys(req.query) }); } catch (e) { /* ignore logging errors */ }
    const url = req.query.url || req.url && new URL(req.url, `http://${req.headers.host}`).searchParams.get('url')
    if (!url) return res.status(400).send('Missing url param')

    // Support webcal: published iCloud links by converting to https:
    const fetchUrl = String(url).replace(/^webcal:/i, 'https:')

    const upstream = await fetch(fetchUrl)
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
}
