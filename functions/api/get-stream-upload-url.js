import { json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  const { CF_ACCOUNT_ID, CF_STREAM_TOKEN } = context.env

  try {
    const res = await fetch(
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
          tusResumable: '1.0.0',
        }),
      }
    )

    const data = await res.json()
    if (!data.success) throw new Error(data.errors?.[0]?.message || 'Stream API error')

    return json({ uploadURL: data.result.uploadURL, uid: data.result.uid })
  } catch (err) {
    return error(err.message)
  }
}
