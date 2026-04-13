// netlify/functions/admin-action.js
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { password, action, id } = JSON.parse(event.body)
  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    if (action === 'approve') {
      const { error } = await supabase
        .from('submissions')
        .update({ approved: true })
        .eq('id', id)
      if (error) throw error
    } else if (action === 'delete') {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id)
      if (error) throw error
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error('Admin action error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
