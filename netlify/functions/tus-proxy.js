// netlify/functions/tus-proxy.js
// Acts as a TUS endpoint proxy between the browser and Cloudflare Stream.
// The browser points tus-js-client at this function as its endpoint.
// This function forwards the request to Cloudflare and passes headers back.

const CF_TUS_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`

exports.handler = async (event) => {
  const method = event.httpMethod

  // Build forwarded headers
  const forwardHeaders = {
    Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
  }

  // Forward tus protocol headers
  const tusPHeaders = [
    'tus-resumable',
    'upload-length',
    'upload-metadata',
    'upload-offset',
    'upload-creator',
    'content-type',
    'content-length',
  ]
  for (const h of tusPHeaders) {
    if (event.headers[h]) forwardHeaders[h] = event.headers[h]
  }

  // For direct_user uploads, append query param
  const cfUrl = `${CF_TUS_ENDPOINT}?direct_user=true`

  const fetchOptions = {
    method,
    headers: forwardHeaders,
  }

  // PATCH requests carry the chunk body
  if (method === 'PATCH' && event.body) {
    fetchOptions.body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
  }

  try {
    const cfRes = await fetch(cfUrl, fetchOptions)

    // Pass back the key tus response headers
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset',
      'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable',
    }

    const passThroughHeaders = ['location', 'upload-offset', 'tus-resumable', 'stream-media-id']
    for (const h of passThroughHeaders) {
      const val = cfRes.headers.get(h)
      if (val) responseHeaders[h] = val
    }

    // Extract uid from Location header for the client
    const location = cfRes.headers.get('location')
    let uid = null
    if (location) {
      const parts = location.split('/')
      uid = parts[parts.length - 1]
      responseHeaders['x-stream-uid'] = uid
    }

    const body = uid ? JSON.stringify({ uid }) : ''

    return {
      statusCode: cfRes.status,
      headers: responseHeaders,
      body,
    }
  } catch (err) {
    console.error('TUS proxy error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
