module.exports = async function handler(req, res) {
  try {
  // Verbose logging controlled by env var to avoid noisy production logs.
  const VERBOSE = !!(process.env && (process.env.VERBOSE_I_CAL === '1' || process.env.VERBOSE_I_CAL === 'true'))
  // Emit immediate invocation info when VERBOSE is set.
  try { if (VERBOSE) console.error('[debug] fetch-ical invoked', { method: req.method, url: req.url, query: req.query && Object.keys(req.query) }); } catch (e) {}

  // Super-early debug short-circuit: inspect raw req.url string (avoid relying on req.query)
  try {
    const rawUrlStr = String(req.url || '')
    const m = rawUrlStr.match(/[?&]debug(?:=([^&]*))?/) // capture value if present
    const debugPresent = !!m
    const debugValue = m && m[1] ? decodeURIComponent(m[1]) : null
    if (debugPresent && (debugValue === null || debugValue === '1' || debugValue === 'true')) {
      const outEarly = {
        rawRequestUrl: rawUrlStr,
        rawQueryString: rawUrlStr.split('?')[1] || null,
        queryObjectKeys: req.query ? Object.keys(req.query) : null,
        headers: req.headers
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.status(200).send(JSON.stringify(outEarly, null, 2))
      return
    }
  } catch (e) {
    /* ignore */
  }

  // Normalize and safely extract the 'url' param. It may be:
  // - req.query.url as a string
  // - req.query.url as an array (from repeated params)
  // - missing and present in the raw req.url's search params
  let rawParam = undefined
  try {
    // If this is a POST with JSON, try to read body first to avoid URL encoding issues.
    if (req.method === 'POST') {
      try {
        const ct = req.headers && (req.headers['content-type'] || req.headers['Content-Type'])
        if (ct && ct.indexOf && ct.indexOf('application/json') !== -1) {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const buf = Buffer.concat(chunks)
          const parsed = JSON.parse(buf.toString('utf8'))
          if (parsed && parsed.url) rawParam = parsed.url
          if (!rawParam && parsed && parsed.b64) {
            try { rawParam = Buffer.from(String(parsed.b64).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') } catch (e) {}
          }
        }
      } catch (e) {
        try { if (VERBOSE) console.error('[fetch-ical] post body parse failed', e && e.stack ? e.stack : String(e)) } catch (e) {}
      }
    }
    // Support a base64-encoded URL fallback to avoid percent-encoding issues.
    // Caller can send `?b64=<base64(url)>` where url is e.g. https://... or webcal://...
    const getB64 = (r) => {
      try {
        if (!r) return null
        if (r.query && r.query.b64) return Array.isArray(r.query.b64) ? r.query.b64[0] : r.query.b64
        // try to extract from raw URL
        const m = (r.url || '').match(/[?&]b64=([^&]+)/)
        return m ? m[1] : null
      } catch (e) { return null }
    }
    const b64raw = getB64(req)
          if (b64raw) {
      try {
        // support URL-safe base64
        const norm = b64raw.replace(/-/g, '+').replace(/_/g, '/')
        rawParam = Buffer.from(norm, 'base64').toString('utf8')
            try { if (VERBOSE) console.error('[fetch-ical] using b64 decoded url', { rawParam }) } catch (e) {}
      } catch (e) {
            try { if (VERBOSE) console.error('[fetch-ical] b64 decode failed', e && e.stack ? e.stack : String(e)) } catch (e) {}
      }
    }
    // Try to read the raw encoded value from req.url first (so we capture exact percent-encoding)
    const getRawQueryValue = (r, key) => {
      try {
        if (!r || !r.url) return null
        const m = r.url.match(new RegExp('[?&]' + key + '=([^&]+)'))
        return m ? m[1] : null
      } catch (e) {
        return null
      }
    }

    const rawFromUrl = getRawQueryValue(req, 'url')
    if (rawFromUrl) {
      rawParam = rawFromUrl
    } else if (req.query && req.query.url) {
      // fallback to parsed value
      rawParam = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
    }
  } catch (e) {
    try { if (VERBOSE) console.error('[fetch-ical] error reading param', e && e.stack ? e.stack : String(e)) } catch (e) {}
  }

  if (!rawParam) {
    res.status(400).send('Missing url param')
    return
  }

  // Percent-decoding may be required if callers double-encode the url.
  let decoded = String(rawParam)
  let decodedOnce = null
  try {
    if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
      decodedOnce = decodeURIComponent(decoded)
      decoded = decodedOnce
    }
  } catch (e) {
    try { if (VERBOSE) console.error('[fetch-ical] decodeURIComponent failed (first)', e && e.stack ? e.stack : String(e)) } catch (e) {}
    decodedOnce = null
  }

  // If we didn't detect a scheme, try a second decode (some callers double-encode)
  try {
    if (decoded && !/^https?:|^webcal:/i.test(decoded) && /%[0-9A-Fa-f]{2}/.test(decoded)) {
      try {
        const decodedTwice = decodeURIComponent(decoded)
        if (decodedTwice) decoded = decodedTwice
        try { if (VERBOSE) console.error('[fetch-ical] applied second decode', { decodedTwice }) } catch (e) {}
      } catch (e) {
        try { if (VERBOSE) console.error('[fetch-ical] second decode failed', e && e.stack ? e.stack : String(e)) } catch (e) {}
      }
    }
  } catch (e) { /* noop */ }

  // As a last-ditch, if the raw encoded value contains 'webcal%3A', replace it to 'https%3A' then decode
  try {
    if (!/^https?:|^webcal:/i.test(decoded) && /webcal%3A/i.test(String(rawParam))) {
      try {
        const replaced = String(rawParam).replace(/webcal%3A/ig, 'https%3A')
        const rdec = decodeURIComponent(replaced)
        if (rdec) decoded = rdec
        try { if (VERBOSE) console.error('[fetch-ical] replaced webcal%3A -> decoded', { replaced, rdec }) } catch (e) {}
      } catch (e) {
        try { if (VERBOSE) console.error('[fetch-ical] replace+decode failed', e && e.stack ? e.stack : String(e)) } catch (e) {}
      }
    }
  } catch (e) { /* noop */ }

  // Convert webcal: to https: when present and sanitize the final URL string.
  const fetchUrl = decoded.replace(/^webcal:/i, 'https:')
  // Remove any invisible/control chars and trim.
  const sanitizedFetchUrl = String(fetchUrl || '').trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '')

  // Validate URL object early so we can log a helpful error before fetching.
  let targetUrlObj = null
  try {
    targetUrlObj = new URL(sanitizedFetchUrl)
  } catch (e) {
    try { console.error('[fetch-ical] invalid fetchUrl', { rawParam, decoded, fetchUrl: sanitizedFetchUrl, err: String(e) }) } catch (e) {}
  }

  try { if (VERBOSE) console.error('[fetch-ical] urls', { rawParam, decoded, fetchUrl: sanitizedFetchUrl, host: targetUrlObj && targetUrlObj.host }) } catch (e) {}

  // If caller asked for debug, return the internal parsing results as JSON
  const q = req.query || {}
  const bodyDebug = req.body && (req.body.debug === true || req.body.debug === '1' || req.body.debug === 1)
  const queryDebug = q.debug === '1' || q.debug === 'true'
    if (queryDebug || bodyDebug) {
    const out = {
      rawRequestUrl: req.url,
      rawParam: rawParam || null,
      decoded: decoded || null,
      fetchUrl: fetchUrl || null,
      query: q
    }
    try { if (VERBOSE) console.error('[fetch-ical] debug-response', out) } catch (e) {}
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.status(200).send(JSON.stringify(out, null, 2))
    return
  }

  // Try a few header permutations to work around upstream protections/rate-limits.
  const headerAttempts = [
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      'Accept': 'text/calendar, */*;q=0.1',
      'Referer': 'https://www.icloud.com/'
    },
    // remove Referer
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      'Accept': 'text/calendar, */*;q=0.1'
    },
    // use curl-like UA and accept-any
    {
      'User-Agent': 'curl/8.0.1',
      'Accept': '*/*'
    }
  ]

  // Append a couple of more aggressive header permutations that explicitly set Host/Origin
  // and avoid compressed responses (some upstreams behave differently for identity).
  try {
    if (targetUrlObj) {
      headerAttempts.push({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        'Accept': 'text/calendar, */*;q=0.1',
        'Referer': 'https://www.icloud.com/',
        'Origin': 'https://www.icloud.com',
        'Accept-Encoding': 'identity',
        'Connection': 'close',
        'Host': targetUrlObj.host
      })
      headerAttempts.push({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        'Accept': '*/*',
        'Origin': 'https://www.icloud.com',
        'Accept-Encoding': 'gzip, deflate, br',
        'Host': targetUrlObj.host
      })
    }
  } catch (e) {
    /* ignore header push errors */
  }

  let lastStatus = null
  let lastBodySnippet = ''
  try {
    for (let i = 0; i < headerAttempts.length; i++) {
      const h = headerAttempts[i]
      try { if (VERBOSE) console.error('[fetch-ical] attempt fetch', { attempt: i + 1, fetchUrl: sanitizedFetchUrl, headers: Object.keys(h) }) } catch (e) {}
      const upstream = await fetch(sanitizedFetchUrl, { headers: h, redirect: 'follow' })
      lastStatus = upstream.status
      try { if (VERBOSE) console.error('[fetch-ical] upstream status', { attempt: i + 1, status: upstream.status, url: fetchUrl }) } catch (e) {}
      if (!upstream.ok) {
        const body = await upstream.text().catch(() => '')
        lastBodySnippet = body && body.slice ? body.slice(0, 200) : String(body)
        try { if (VERBOSE) console.error('[fetch-ical] upstream non-ok body', { attempt: i + 1, status: upstream.status, body: lastBodySnippet }) } catch (e) {}
        // try next header set
        continue
      }
      // success
      const text = await upstream.text()
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('X-Debug-Invoked', 'fetch-ical')
      res.send(text)
      return
    }

    // All attempts failed
    try { console.error('[fetch-ical] all fetch attempts failed', { lastStatus, lastBodySnippet }) } catch (e) {}
    return res.status(502).send('Upstream error')
  } catch (err) {
    try { console.error('[fetch-ical] fetch exception', err && err.stack ? err.stack : String(err), { fetchUrl, rawParam }) } catch (e) {}
    res.status(500).send('fetch failed')
    return
  }
  } catch (error) {
    console.error('[fetch-ical] unhandled error', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
