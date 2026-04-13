import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { base64, contentType, path } = await context.request.json()
    const db = supabaseClient(context.env)

    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const ok = await db.storage.upload('memories-photos', path, buffer, contentType)

    if (!ok) throw new Error('Storage upload failed')
    return json({ path })
  } catch (err) {
    return error(err.message)
  }
}
