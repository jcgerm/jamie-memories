import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { id, photoPaths, videoUids } = await context.request.json()
    const db = supabaseClient(context.env)
    await db.update('submissions', { photo_paths: photoPaths, video_uids: videoUids }, id)
    return json({ ok: true })
  } catch (err) {
    return error(err.message)
  }
}
