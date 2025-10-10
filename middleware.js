export function middleware(req) {
  const auth = req.headers.get('authorization') || ''
  const user = process.env.BASIC_AUTH_USER || ''
  const pass = process.env.BASIC_AUTH_PASS || ''
  if (!user || !pass) return new Response(null, { status: 200 }) // no auth configured

  if (!auth || !auth.startsWith('Basic ')) {
    return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="LifeCal"' } })
  }

  const b64 = auth.split(' ')[1] || ''
  try {
    const decoded = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8')
    const [u, p] = decoded.split(':')
    if (u === user && p === pass) return new Response(null, { status: 200 })
  } catch (e) {
    // fall through
  }
  return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="LifeCal"' } })
}

export const config = { matcher: '/:path*' }
