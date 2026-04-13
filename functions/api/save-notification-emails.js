import { json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password, emails } = await context.request.json()
    if (password !== context.env.ADMIN_PASSWORD) return json({ error: 'Unauthorized' }, 401)

    const value = JSON.stringify(emails.filter(e => e.trim()))
    await fetch(`${context.env.SUPABASE_URL}/rest/v1/site_settings`, {
      method: 'POST',
      headers: {
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ key: 'notification_emails', value }),
    })
    return json({ ok: true })
  } catch (err) {
    return error(err.message)
  }
}
