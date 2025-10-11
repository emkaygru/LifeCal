// middleware neutralized for debugging deployments. To re-enable, restore
// the original guarded middleware or rename middleware.disabled.js back to
// middleware.js.

export function middleware(request) {
	// Return 200 for all requests while debugging deployments so the Edge
	// runtime doesn't run any authentication logic.
	return new Response(null, { status: 200 })
}

export const config = { matcher: '/:path*' }
