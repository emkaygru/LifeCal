// Archived: api/force-runtime-logs.js
console.error('[runtime-debug] module loaded (archived)', new Date().toISOString())

module.exports = async function handler(req, res) {
  try {
    console.error('[runtime-debug] handler invoked (archived)', { method: req.method, url: req.url, time: new Date().toISOString() })
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }))
  } catch (err) {
    console.error('[runtime-debug] handler error (archived)', err && err.stack ? err.stack : err)
    res.statusCode = 500
    res.end(JSON.stringify({ ok: false, error: String(err) }))
  }
}
