exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxDurationSeconds: 3600, expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), tusResumable: '1.0.0' }),
      }
    )
    const data = await response.json()
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Stream API error')
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadURL: data.result.uploadURL, uid: data.result.uid }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
