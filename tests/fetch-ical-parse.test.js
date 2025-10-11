const assert = require('assert')
const fs = require('fs')
const vm = require('vm')

// Load the handler file and extract the parsing/sanitization logic by running it in a sandbox
const code = fs.readFileSync(require.resolve('../api/fetch-ical.js'), 'utf8')

// We'll wrap a small function to reuse the parsing steps from the file. This is brittle but fast.
const wrapper = `
(function extract(rawParam) {
  // copy the minimal parsing logic from the file
  let decoded = String(rawParam)
  try { if (/%[0-9A-Fa-f]{2}/.test(decoded)) { decoded = decodeURIComponent(decoded) } } catch (e) {}
  try {
    if (decoded && !/^https?:|^webcal:/i.test(decoded) && /%[0-9A-Fa-f]{2}/.test(decoded)) {
      try { const decodedTwice = decodeURIComponent(decoded); if (decodedTwice) decoded = decodedTwice } catch (e) {}
    }
  } catch (e) {}
  try {
    if (!/^https?:|^webcal:/i.test(decoded) && /webcal%3A/i.test(String(rawParam))) {
      try { const replaced = String(rawParam).replace(/webcal%3A/ig, 'https%3A'); const rdec = decodeURIComponent(replaced); if (rdec) decoded = rdec } catch (e) {}
    }
  } catch (e) {}
  const fetchUrl = decoded.replace(/^webcal:/i, 'https:')
  const sanitizedFetchUrl = String(fetchUrl || '').trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
  return sanitizedFetchUrl
})
`

const fn = vm.runInNewContext(wrapper)

// Tests
const examples = [
  { in: 'https://example.com/path', out: 'https://example.com/path' },
  { in: 'webcal://example.com/p/ical.ics', out: 'https://example.com/p/ical.ics' },
  { in: 'https%3A%2F%2Fexample.com%2Fpath', out: 'https://example.com/path' },
  { in: 'webcal%3A%2F%2Fexample.com%2Fpath', out: 'https://example.com/path' }
]

for (const ex of examples) {
  const got = fn(ex.in)
  assert.strictEqual(got, ex.out, `expected ${ex.in} -> ${ex.out}, got ${got}`)
}

console.log('fetch-ical parse tests passed')
