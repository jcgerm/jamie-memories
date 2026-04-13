const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const { data } = await supabase.from('site_settings').select('key,value')
    const result = {}
    if (Array.isArray(data)) {
      for (const row of data) result[row.key] = row.value
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
