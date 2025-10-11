module.exports = async function handler(req, res) {
  try {
    try { console.error('[debug] recipe-details invoked', { method: req.method, query: req.query && Object.keys(req.query) }); } catch (e) {}
    const id = req.query.id
    const key = process.env.SPOONACULAR_KEY
    if (!id || !key) return res.json({})

    const api = `https://api.spoonacular.com/recipes/${encodeURIComponent(id)}/information?includeNutrition=false&apiKey=${key}`
  const upstream = await fetch(api)
  const json = await upstream.json()
  res.setHeader('X-Debug-Invoked', 'recipe-details')
  res.json(json)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
