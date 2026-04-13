import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password, action, id } = await context.request.json()

    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = supabaseClient(context.env)

    if (action === 'approve') {
      await db.update('submissions', { approved: true }, id)
    } else if (action === 'delete') {
      await db.delete('submissions', id)
    } else {
      return json({ error: 'Unknown action' }, 400)
    }

    return json({ ok: true })
  } catch (err) {
    return error(err.message)
  }
}
