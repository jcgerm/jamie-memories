// netlify/functions/upload-video.js
// Proxies the video file to Cloudflare Stream server-side, avoiding CORS.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN

  try {
    // First get a direct upload URL from Cloudflare
    const initRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      }
    )

    const initData = await initRes.json()
    if (!initData.success) {
      throw new Error(initData.errors?.[0]?.message || 'Failed to get upload URL')
    }

    const { uploadURL, uid } = initData.result

    // Decode the base64 video body and upload it to Cloudflare
    const videoBuffer = Buffer.from(event.body, 'base64')

    const uploadRes = await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': event.headers['x-content-type'] || 'video/mp4' },
      body: videoBuffer,
    })

    if (!uploadRes.ok) {
      throw new Error(`Cloudflare upload failed: ${uploadRes.status}`)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    }
  } catch (err) {
    console.error('Video upload error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
