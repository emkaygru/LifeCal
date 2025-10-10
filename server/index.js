const express = require('express')
const app = express()
let fetchFn = global.fetch
if (!fetchFn) {
  // dynamic import node-fetch on older Node
  try {
    fetchFn = (...args) => import('node-fetch').then(m => m.default(...args))
  } catch (e) {
    console.warn('node-fetch not available; fetch will fail if not running Node 18+')
  }
}
const PORT = process.env.PORT || 4000

app.get('/fetch-ical', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).send('missing url')
  try {
    const u = url.replace(/^webcal:/, 'https:')
    const r = await fetchFn(u)
    const text = await r.text()
    res.set('Content-Type', 'text/calendar')
    res.send(text)
  } catch (err) {
    res.status(500).send('fetch error')
  }
})

// recipe search proxy (optional). Set SPOONACULAR_KEY in env to enable.
app.get('/recipe-search', async (req, res) => {
  const q = req.query.query
  if (!q) return res.status(400).send({ results: [] })
  const key = process.env.SPOONACULAR_KEY
  if (!key) return res.status(200).send({ results: [] })
  try {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(q)}&addRecipeInformation=true&number=5&apiKey=${key}`
    const r = await fetchFn(url)
    const j = await r.json()
    res.send(j)
  } catch (e) {
    res.status(500).send({ results: [] })
  }
})

// recipe details proxy
app.get('/recipe-details', async (req, res) => {
  const id = req.query.id
  const key = process.env.SPOONACULAR_KEY
  if (!id) return res.status(400).send({})
  if (!key) return res.status(200).send({})
  try {
    const url = `https://api.spoonacular.com/recipes/${encodeURIComponent(id)}/information?includeNutrition=false&apiKey=${key}`
    const r = await fetchFn(url)
    const j = await r.json()
    res.send(j)
  } catch (e) {
    res.status(500).send({})
  }
})

app.listen(PORT, () => console.log('Server listening on', PORT))
