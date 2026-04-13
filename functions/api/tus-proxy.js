import { error } from '../_shared/supabase.js'

export async function onRequest(context) {
  const { CF_ACCOUNT_ID, CF_STREAM_TOKEN } = context.env
  const method = context.request.method

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const forwardHeaders = {
    Authorization: `Bearer ${CF_STREAM_TOKEN}`,
  }

  const tusHeaders = [
    'tus-resumable', 'upload-length', 'upload-metadata',
    'upload-offset', 'content-type', 'content-length',
  ]
  for (const h of tusHeaders) {
    const val = context.request.headers.get(h)
    if (val) forwardHeaders[h] = val
  }

  const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream?direct_user=true`

  try {
    const fetchOptions = { method, headers: forwardHeaders }

    if (method === 'PATCH') {
      fetchOptions.body = context.request.body
    }

    const cfRes = await fetch(cfUrl, fetchOptions)

    const responseHeaders = corsHeaders()
    const passThrough = ['location', 'upload-offset', 'tus-resumable', 'stream-media-id']
    for (const h of passThrough) {
      const val = cfRes.headers.get(h)
      if (val) responseHeaders[h] = val
    }

    const location = cfRes.headers.get('location')
    let uid = null
    if (location) {
      const parts = location.split('/')
      uid = parts[parts.length - 1]
      responseHeaders['x-stream-uid'] = uid
    }

    return new Response(uid ? JSON.stringify({ uid }) : null, {
      status: cfRes.status,
      headers: responseHeaders,
    })
  } catch (err) {
    return error(err.message)
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
