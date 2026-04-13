import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password, base64, contentType } = await context.request.json()

    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = supabaseClient(context.env)
    const ext = contentType.split('/')[1] || 'jpg'
    const path = `hero/jamie-hero.${ext}`

    // Upload to Supabase storage (upsert by using same path each time)
    const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

    // Delete existing first then re-upload (acts as upsert)
    await fetch(`${context.env.SUPABASE_URL}/storage/v1/object/memories-photos/${path}`, {
      method: 'DELETE',
      headers: {
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    })

    const ok = await db.storage.upload('memories-photos', path, buffer, contentType)
    if (!ok) throw new Error('Upload failed')

    const url = `${context.env.SUPABASE_URL}/storage/v1/object/public/memories-photos/${path}?t=${Date.now()}`

    // Upsert the setting using ON CONFLICT
    await fetch(`${context.env.SUPABASE_URL}/rest/v1/site_settings`, {
      method: 'POST',
      headers: {
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: 'hero_photo', value: url }),
    })

    return json({ url })
  } catch (err) {
    return error(err.message)
  }
}
