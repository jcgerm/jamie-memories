// netlify/functions/get-stream-upload-url.js
// This keeps your Cloudflare Stream API token server-side only.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID
  const CF_STREAM_TOKEN = process.env.CF_STREAM_TOKEN

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600, // 1 hour max per video
          expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // upload link valid 1hr
        }),
      }
    )

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Stream API error')
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadURL: data.result.uploadURL,
        uid: data.result.uid,
      }),
    }
  } catch (err) {
    console.error('Stream upload URL error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
