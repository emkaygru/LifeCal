module.exports = async function handler(req, res) {
  try {
    const url = req.query.url || req.url && new URL(req.url, `http://${req.headers.host}`).searchParams.get('url')
    if (!url) return res.status(400).send('Missing url param')

    const upstream = await fetch(url)
    if (!upstream.ok) return res.status(502).send('Upstream error')
    const text = await upstream.text()
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.send(text)
  } catch (err) {
    res.status(500).send(String(err?.message || err))
  }
}
