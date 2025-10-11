module.exports = async function handler(req, res) {
  try {
    const out = {
      method: req.method,
      rawRequestUrl: req.url,
      query: req.query || null,
      headers: req.headers || null
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).send(JSON.stringify(out, null, 2))
  } catch (err) {
    try { console.error('[fetch-ical-debug] error', err && err.stack ? err.stack : String(err)) } catch (e) {}
    res.status(500).json({ error: 'debug-failed', message: String(err) })
  }
}
