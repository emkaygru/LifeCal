// Guarded Basic Auth middleware for Vercel Edge.
// If BASIC_AUTH_USER / BASIC_AUTH_PASS are set in the environment, requests
// will require Basic Auth. If they are not set, this middleware is a no-op.

const USER = process.env.BASIC_AUTH_USER
const PASS = process.env.BASIC_AUTH_PASS

export function middleware(request) {
	// no-op when not configured
	if (!USER || !PASS) return undefined

	const auth = request.headers.get('authorization') || ''
	if (!auth.startsWith('Basic ')) return unauthorized()

	try {
		const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8')
		const [user, pass] = credentials.split(':')
		if (user === USER && pass === PASS) return undefined
		return unauthorized()
	} catch (e) {
		return unauthorized()
	}

	function unauthorized() {
		return new Response('Unauthorized', {
			status: 401,
			headers: { 'WWW-Authenticate': 'Basic realm="LifeCal"' }
		})
	}
}

export const config = { matcher: '/:path*' }
