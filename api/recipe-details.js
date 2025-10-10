export default async function handler(request) {
  try {
    const id = new URL(request.url).searchParams.get('id')
    const key = process.env.SPOONACULAR_KEY
    if (!id || !key) return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })

    const api = `https://api.spoonacular.com/recipes/${encodeURIComponent(id)}/information?includeNutrition=false&apiKey=${key}`
    const res = await fetch(api)
    const json = await res.json()
    return new Response(JSON.stringify(json), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
