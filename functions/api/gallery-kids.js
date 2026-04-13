import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestGet(context) {
  try {
    const db = supabaseClient(context.env)
    const data = await db.select('submissions',
      { approved: 'true', for_kids: 'yes' },
      'id,created_at,submitter_name,relationship,memory,photo_paths,video_uids,video_link'
    )
    return json(data, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  } catch (err) {
    return error(err.message)
  }
}
