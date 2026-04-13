import { json, error } from '../_shared/supabase.js'

export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json()
    if (password !== context.env.ADMIN_PASSWORD) {
      return json({ error: 'Unauthorized' }, 401)
    }

    if (!context.env.BACKUP) {
      return json({ available: false, message: 'R2 backup not configured' })
    }

    // Get submissions index
    const indexObj = await context.env.BACKUP.get('submissions-index.json')
    const index = indexObj ? JSON.parse(await indexObj.text()) : []

    // Get video manifest
    const manifestObj = await context.env.BACKUP.get('video-manifest.json')
    const manifest = manifestObj ? JSON.parse(await manifestObj.text()) : []

    const lastBackup = index.length > 0 ? index[0].backed_up_at : null

    return json({
      available: true,
      submissionCount: index.length,
      videoCount: manifest.length,
      lastBackedUpAt: lastBackup,
      lastSubmitterName: index.length > 0 ? index[0].submitter_name : null,
    })
  } catch (err) {
    return error(err.message)
  }
}
