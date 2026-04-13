const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const { password, emails } = JSON.parse(event.body)
  if (password !== process.env.ADMIN_PASSWORD) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const value = JSON.stringify(emails.filter(e => e.trim()))
    await supabase.from('site_settings').upsert({ key: 'notification_emails', value })
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
