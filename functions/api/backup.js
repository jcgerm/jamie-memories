import { supabaseClient, json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password, type } = await context.request.json()

    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = supabaseClient(context.env)
    const data = await db.select('submissions', {})

    if (type === 'json') {
      // Full data export
      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="remembering-jamie-backup-${new Date().toISOString().slice(0,10)}.json"`,
        },
      })
    }

    if (type === 'urls') {
      // All photo and video URLs as plain text for download managers
      const supabaseUrl = context.env.SUPABASE_URL
      const cfAccountId = context.env.CF_ACCOUNT_ID
      const lines = []

      for (const s of data) {
        lines.push(`# ${s.submitter_name} — ${new Date(s.created_at).toLocaleDateString()}`)

        if (s.photo_paths?.length) {
          for (const path of s.photo_paths) {
            lines.push(`${supabaseUrl}/storage/v1/object/public/memories-photos/${path}`)
          }
        }

        if (s.video_uids?.length) {
          for (const uid of s.video_uids) {
            lines.push(`https://customer-${cfAccountId}.cloudflarestream.com/${uid}/downloads/default.mp4`)
          }
        }

        if (s.video_link) {
          lines.push(`# Linked video (manual download): ${s.video_link}`)
        }

        lines.push('')
      }

      return new Response(lines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="remembering-jamie-media-urls-${new Date().toISOString().slice(0,10)}.txt"`,
        },
      })
    }

    return json({ error: 'Unknown type' }, 400)
  } catch (err) {
    return error(err.message)
  }
}
