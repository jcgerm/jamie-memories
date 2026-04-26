import { supabaseClient, json, error } from '../_shared/supabase.js'

const PAGE_SIZE = 10

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url)
    const limit = parseInt(url.searchParams.get('limit') ?? PAGE_SIZE, 10)
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
    const db = supabaseClient(context.env)
    const { data, total } = await db.select('submissions',
      { approved: 'true', for_kids: 'yes' },
      'id,created_at,submitter_name,relationship,prompt,memory,photo_paths,video_uids,video_link',
      { limit, offset, count: true }
    )
    return json({ items: data, total }, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    })
  } catch (err) {
    return error(err.message)
  }
}
