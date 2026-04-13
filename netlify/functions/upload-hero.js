const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  if (JSON.parse(event.body).password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { base64, contentType } = JSON.parse(event.body)
    const ext = contentType.split('/')[1] || 'jpg'
    const path = `hero/jamie-hero.${ext}`
    const buffer = Buffer.from(base64, 'base64')
    await supabase.storage.from('memories-photos').remove([path])
    const { error } = await supabase.storage.from('memories-photos').upload(path, buffer, { contentType, upsert: true })
    if (error) throw error
    const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/memories-photos/${path}?t=${Date.now()}`
    await supabase.from('site_settings').upsert({ key: 'hero_photo', value: url })
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
