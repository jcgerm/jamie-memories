// netlify/functions/gallery-kids.js
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, created_at, submitter_name, relationship, memory, photo_paths, video_uids, video_link')
      .eq('approved', true)
      .eq('for_kids', 'yes')
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error('Kids gallery fetch error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
