const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    const body = JSON.parse(event.body)
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        submitter_name: body.submitterName,
        relationship: body.relationship || null,
        memory: body.memory,
        for_kids: body.forKids,
        video_link: body.videoLink || null,
        prompt: body.prompt || null,
        approved: false,
      })
      .select().single()
    if (error) throw error
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
