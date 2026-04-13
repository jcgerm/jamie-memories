const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { base64, contentType, path } = JSON.parse(event.body)
    const buffer = Buffer.from(base64, 'base64')
    const { error } = await supabase.storage.from('memories-photos').upload(path, buffer, { contentType, upsert: false })
    if (error) throw error
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
