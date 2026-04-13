const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { data } = await supabase.from('site_settings').select('key,value')
    const hero = Array.isArray(data) ? data.find(r => r.key === 'hero_photo') : null
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: hero?.value || null }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
