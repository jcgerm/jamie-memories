import { supabaseClient, json, error } from '../_shared/supabase.js'
import { backupSubmission } from '../_shared/backup.js'

export async function onRequestPost(context) {
  try {
    const { password, action, id } = await context.request.json()

    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const db = supabaseClient(context.env)

    if (action === 'approve') {
      await db.update('submissions', { approved: true }, id)

      // Fetch full submission and mirror to R2 backup
      if (context.env.BACKUP) {
        try {
          const data = await db.select('submissions', { id: id })
          const submission = Array.isArray(data) ? data[0] : null
          if (submission) {
            await backupSubmission(submission, db, context.env.BACKUP)
          }
        } catch (backupErr) {
          // Backup failure never blocks approval
          console.error('Backup failed:', backupErr)
        }
      }

    } else if (action === 'delete') {
      await db.delete('submissions', id)
    } else {
      return json({ error: 'Unknown action' }, 400)
    }

    return json({ ok: true })
  } catch (err) {
    return error(err.message)
  }
}
