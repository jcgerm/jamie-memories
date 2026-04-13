const CF_TUS_ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream`

exports.handler = async (event) => {
  const method = event.httpMethod
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() }
  }

  const forwardHeaders = { Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}` }
  const tusHeaders = ['tus-resumable','upload-length','upload-metadata','upload-offset','content-type','content-length']
  for (const h of tusHeaders) {
    if (event.headers[h]) forwardHeaders[h] = event.headers[h]
  }

  try {
    const fetchOptions = { method, headers: forwardHeaders }
    if (method === 'PATCH' && event.body) {
      fetchOptions.body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
    }

    const cfRes = await fetch(`${CF_TUS_ENDPOINT}?direct_user=true`, fetchOptions)
    const responseHeaders = corsHeaders()
    const passThrough = ['location','upload-offset','tus-resumable','stream-media-id']
    for (const h of passThrough) {
      const val = cfRes.headers.get(h)
      if (val) responseHeaders[h] = val
    }

    const location = cfRes.headers.get('location')
    let uid = null
    if (location) {
      uid = location.split('/').pop()
      responseHeaders['x-stream-uid'] = uid
    }

    return { statusCode: cfRes.status, headers: responseHeaders, body: uid ? JSON.stringify({ uid }) : '' }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, PATCH, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Tus-Resumable, Upload-Length, Upload-Metadata, Upload-Offset',
    'Access-Control-Expose-Headers': 'Location, Upload-Offset, Tus-Resumable, x-stream-uid',
  }
}
