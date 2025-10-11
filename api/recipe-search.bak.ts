// Backed up original TypeScript handler to recipe-search.bak.ts
// The active CommonJS handler is api/recipe-search.js

export async function handler(request: Request) {
  return new Response('bak', { status: 200 })
}
export default async function handler(request: Request) {
  try {
    const q = new URL(request.url).searchParams.get('query') || ''
    const key = process.env.SPOONACULAR_KEY
    if (!key) return new Response(JSON.stringify({ results: [] }), { headers: { 'Content-Type': 'application/json' } })

    const api = `https://api.spoonacular.com/recipes/complexSearch?number=6&query=${encodeURIComponent(q)}&apiKey=${key}`
    const res = await fetch(api)
    const json = await res.json()
    return new Response(JSON.stringify(json), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

// backup copy - not used in deployment
