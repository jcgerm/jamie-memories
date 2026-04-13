import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestGet(context) {
  try {
    const db = supabaseClient(context.env)
    const data = await db.select('site_settings', {}, 'key,value')
    const heroSetting = Array.isArray(data) ? data.find(r => r.key === 'hero_photo') : null
    return json({ url: heroSetting?.value || null })
  } catch (err) {
    return error(err.message)
  }
}
