// middleware neutralized for debugging deployments.
// This minimal Edge middleware exports a no-op handler so Vercel can load the
// deployment without requiring BASIC_AUTH env vars. Restore the guarded
// middleware from middleware.disabled.js when ready.

export function middleware(request) {
	// no-op: return undefined to let the platform continue to static serving
	return undefined
}

export const config = { matcher: '/:path*' }
