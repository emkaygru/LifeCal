// quick syntax parse check for middleware.js
try {
  const path = require('path')
  const mw = require(path.resolve(__dirname, '..', 'middleware.js'))
  console.log('middleware export keys:', Object.keys(mw))
  process.exit(0)
} catch (e) {
  console.error('middleware parse error:', e && e.stack ? e.stack : e)
  process.exit(2)
}
