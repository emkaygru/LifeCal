module.exports = async function handler(req, res) {
  try {
    const q = req.query.query || ''
    const key = process.env.SPOONACULAR_KEY
    if (!key) return res.json({ results: [] })

    const api = `https://api.spoonacular.com/recipes/complexSearch?number=6&query=${encodeURIComponent(q)}&apiKey=${key}`
    const upstream = await fetch(api)
    const json = await upstream.json()
    res.json(json)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
