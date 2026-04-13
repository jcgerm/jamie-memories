// functions/_shared/notify.js
// Sends email notifications via Resend when a new submission arrives.

export async function notifyNewSubmission(submission, env) {
  if (!env.RESEND_API_KEY) return

  // Get notification emails from site_settings
  let emails = []
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/site_settings?key=eq.notification_emails&select=value`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    const data = await res.json()
    if (data?.[0]?.value) {
      emails = JSON.parse(data[0].value)
    }
  } catch (err) {
    console.error('Failed to fetch notification emails:', err)
    return
  }

  if (!emails.length) return

  const mediaNote = [
    submission.photo_paths?.length ? `${submission.photo_paths.length} photo(s)` : null,
    submission.video_uids?.length ? `${submission.video_uids.length} video(s)` : null,
    submission.video_link ? 'video link' : null,
  ].filter(Boolean).join(', ')

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2c2420;">
      <div style="border-bottom: 1px solid #e8ddd0; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-style: italic; font-weight: 400; color: #3d2b1f; margin: 0;">
          A new memory was shared
        </h1>
        <p style="font-size: 13px; color: #9a8578; margin: 4px 0 0; font-family: sans-serif;">
          Remembering Jamie
        </p>
      </div>

      <p style="font-family: sans-serif; font-size: 14px; color: #3d2b1f; margin: 0 0 4px;">
        <strong>${submission.submitter_name}</strong>
        ${submission.relationship ? `<span style="color: #9a8578;"> · ${submission.relationship}</span>` : ''}
      </p>

      ${submission.prompt ? `
        <p style="font-size: 12px; color: #b5705a; font-style: italic; font-family: sans-serif; margin: 0 0 12px;">
          Responding to: "${submission.prompt}"
        </p>
      ` : ''}

      <blockquote style="border-left: 2px solid #d4b896; margin: 0 0 20px; padding: 8px 0 8px 16px; font-size: 15px; line-height: 1.7; color: #2c2420; font-style: italic;">
        "${submission.memory?.slice(0, 400)}${submission.memory?.length > 400 ? '…' : ''}"
      </blockquote>

      ${mediaNote ? `
        <p style="font-family: sans-serif; font-size: 13px; color: #9a8578; margin: 0 0 20px;">
          Includes: ${mediaNote}
        </p>
      ` : ''}

      <a href="https://rememberingjamie.com/admin"
         style="display: inline-block; background: #3d2b1f; color: #faf7f2; text-decoration: none;
                font-family: sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
                padding: 10px 24px; border-radius: 4px;">
        Review in admin →
      </a>

      <p style="font-family: sans-serif; font-size: 11px; color: #d4b896; margin-top: 32px;">
        Remembering Jamie · You're receiving this because you're set up as a notification contact.
      </p>
    </div>
  `

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Remembering Jamie <notifications@rememberingjamie.com>',
        to: emails,
        subject: `New memory from ${submission.submitter_name}`,
        html,
      }),
    })
  } catch (err) {
    console.error('Failed to send notification email:', err)
  }
}
