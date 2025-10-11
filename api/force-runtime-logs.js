// Small helper to force runtime logs in Vercel. Keeps a module-load log plus
// a per-request log so you can find entries in the Vercel runtime logs view.
console.error('[runtime-debug] module loaded', new Date().toISOString())

module.exports = async function handler(req, res) {
  try {
    console.error('[runtime-debug] handler invoked', { method: req.method, url: req.url, time: new Date().toISOString() })
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }))
  } catch (err) {
    console.error('[runtime-debug] handler error', err && err.stack ? err.stack : err)
    res.statusCode = 500
    res.end(JSON.stringify({ ok: false, error: String(err) }))
  }
}
