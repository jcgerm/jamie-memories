// netlify/functions/admin-submissions.js
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Simple password check — never expose service role key without auth
  const { password, filter } = JSON.parse(event.body)
  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    let query = supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('approved', false)
    if (filter === 'approved') query = query.eq('approved', true)

    const { data, error } = await query
    if (error) throw error

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error('Admin fetch error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
