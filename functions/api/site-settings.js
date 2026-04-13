import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestGet(context) {
  try {
    const db = supabaseClient(context.env)
    const data = await db.select('site_settings', {}, 'key,value')
    const result = {}
    if (Array.isArray(data)) {
      for (const row of data) result[row.key] = row.value
    }
    return json(result)
  } catch (err) {
    return error(err.message)
  }
}
