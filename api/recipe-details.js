module.exports = async function handler(req, res) {
  try {
    const id = req.query.id
    const key = process.env.SPOONACULAR_KEY
    if (!id || !key) return res.json({})

    const api = `https://api.spoonacular.com/recipes/${encodeURIComponent(id)}/information?includeNutrition=false&apiKey=${key}`
    const upstream = await fetch(api)
    const json = await upstream.json()
    res.json(json)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
