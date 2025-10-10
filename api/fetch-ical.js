export default async function handler(request) {
  try {
    const url = new URL(request.url).searchParams.get('url')
    if (!url) return new Response('Missing url param', { status: 400 })

    const res = await fetch(url)
    if (!res.ok) return new Response('Upstream error', { status: 502 })
    const text = await res.text()
    return new Response(text, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } })
  } catch (err) {
    return new Response(String(err?.message || err), { status: 500 })
  }
}
