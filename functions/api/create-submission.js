import { supabaseClient, json, error } from '../_shared/supabase.js'
import { notifyNewSubmission } from '../_shared/notify.js'

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const db = supabaseClient(context.env)

    const data = await db.insert('submissions', {
      submitter_name: body.submitterName,
      relationship: body.relationship || null,
      memory: body.memory,
      for_kids: body.forKids,
      video_link: body.videoLink || null,
      prompt: body.prompt || null,
      approved: false,
    })

    // Fire notification email — never block submission on failure
    context.waitUntil(
      notifyNewSubmission(data, context.env).catch(err =>
        console.error('Notification failed:', err)
      )
    )

    return json({ id: data.id })
  } catch (err) {
    return error(err.message)
  }
}
