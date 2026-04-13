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

    // Fire notification email async (don't await — never block submission)
    sendNotification(data, supabase).catch(err => console.error('Notification failed:', err))

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: data.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

async function sendNotification(submission, supabase) {
  if (!process.env.RESEND_API_KEY) return
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'notification_emails').single()
  if (!data?.value) return
  const emails = JSON.parse(data.value)
  if (!emails.length) return

  const mediaNote = [
    submission.photo_paths?.length ? `${submission.photo_paths.length} photo(s)` : null,
    submission.video_uids?.length ? `${submission.video_uids.length} video(s)` : null,
    submission.video_link ? 'video link' : null,
  ].filter(Boolean).join(', ')

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2420;">
      <div style="border-bottom: 1px solid #e8ddd0; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-style: italic; font-weight: 400; color: #3d2b1f; margin: 0;">A new memory was shared</h1>
        <p style="font-size: 13px; color: #9a8578; margin: 4px 0 0; font-family: sans-serif;">Remembering Jamie</p>
      </div>
      <p style="font-family: sans-serif; font-size: 14px; color: #3d2b1f; margin: 0 0 4px;">
        <strong>${submission.submitter_name}</strong>
        ${submission.relationship ? `<span style="color: #9a8578;"> · ${submission.relationship}</span>` : ''}
      </p>
      ${submission.prompt ? `<p style="font-size: 12px; color: #b5705a; font-style: italic; font-family: sans-serif; margin: 0 0 12px;">Responding to: "${submission.prompt}"</p>` : ''}
      <blockquote style="border-left: 2px solid #d4b896; margin: 0 0 20px; padding: 8px 0 8px 16px; font-size: 15px; line-height: 1.7; color: #2c2420; font-style: italic;">
        "${submission.memory?.slice(0, 400)}${submission.memory?.length > 400 ? '…' : ''}"
      </blockquote>
      ${mediaNote ? `<p style="font-family: sans-serif; font-size: 13px; color: #9a8578; margin: 0 0 20px;">Includes: ${mediaNote}</p>` : ''}
      <a href="https://rememberingjamie.com/admin" style="display: inline-block; background: #3d2b1f; color: #faf7f2; text-decoration: none; font-family: sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 24px; border-radius: 4px;">Review in admin →</a>
      <p style="font-family: sans-serif; font-size: 11px; color: #d4b896; margin-top: 32px;">Remembering Jamie · You're receiving this because you're set up as a notification contact.</p>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Remembering Jamie <notifications@rememberingjamie.com>',
      to: emails,
      subject: `New memory from ${submission.submitter_name}`,
      html,
    }),
  })
}
