export function middleware(req) {
  // disabled backup of middleware; see middleware.js
  return new Response(null, { status: 200 })
}

export const config = { matcher: '/:path*' }
