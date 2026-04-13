import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password, filter } = await context.request.json()

    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = supabaseClient(context.env)
    const filters = {}
    if (filter === 'pending') filters.approved = 'false'
    if (filter === 'approved') filters.approved = 'true'

    const data = await db.select('submissions', filters)
    return json(Array.isArray(data) ? data : [])
  } catch (err) {
    return error(err.message)
  }
}
