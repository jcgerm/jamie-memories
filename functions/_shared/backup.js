// functions/_shared/backup.js
// Mirrors approved submissions to Cloudflare R2 on every approval.

export async function backupSubmission(submission, db, r2) {
  const results = { json: false, photos: [], videoManifest: false }

  // 1. Save full submission JSON
  try {
    await r2.put(`submissions/${submission.id}.json`, JSON.stringify(submission, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    })
    results.json = true
  } catch (err) {
    console.error('Backup JSON failed:', err)
  }

  // 2. Copy photos from Supabase Storage to R2
  if (submission.photo_paths?.length) {
    for (const path of submission.photo_paths) {
      try {
        const buffer = await db.storage.download('memories-photos', path)
        if (buffer) {
          const ext = path.split('.').pop()
          const r2Key = `photos/${submission.id}/${path.split('/').pop()}`
          await r2.put(r2Key, buffer, {
            httpMetadata: { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` },
          })
          results.photos.push(r2Key)
        }
      } catch (err) {
        console.error(`Backup photo failed: ${path}`, err)
      }
    }
  }

  // 3. Append video UIDs to running manifest
  if (submission.video_uids?.length || submission.video_link) {
    try {
      let manifest = []
      const existing = await r2.get('video-manifest.json')
      if (existing) {
        manifest = JSON.parse(await existing.text())
      }

      for (const uid of (submission.video_uids || [])) {
        manifest.push({
          submissionId: submission.id,
          submitterName: submission.submitter_name,
          uid,
          downloadUrl: `https://customer-stream.cloudflarestream.com/${uid}/downloads/default.mp4`,
          addedAt: new Date().toISOString(),
        })
      }

      if (submission.video_link) {
        manifest.push({
          submissionId: submission.id,
          submitterName: submission.submitter_name,
          uid: null,
          externalLink: submission.video_link,
          addedAt: new Date().toISOString(),
        })
      }

      await r2.put('video-manifest.json', JSON.stringify(manifest, null, 2), {
        httpMetadata: { contentType: 'application/json' },
      })
      results.videoManifest = true
    } catch (err) {
      console.error('Backup video manifest failed:', err)
    }
  }

  // 4. Update running submissions index
  try {
    let index = []
    const existing = await r2.get('submissions-index.json')
    if (existing) {
      index = JSON.parse(await existing.text())
    }
    index = index.filter(s => s.id !== submission.id)
    index.unshift({
      id: submission.id,
      submitter_name: submission.submitter_name,
      relationship: submission.relationship,
      memory: submission.memory,
      prompt: submission.prompt,
      for_kids: submission.for_kids,
      created_at: submission.created_at,
      photo_count: submission.photo_paths?.length || 0,
      video_count: submission.video_uids?.length || 0,
      has_video_link: !!submission.video_link,
      backed_up_at: new Date().toISOString(),
    })
    await r2.put('submissions-index.json', JSON.stringify(index, null, 2), {
      httpMetadata: { contentType: 'application/json' },
    })
  } catch (err) {
    console.error('Backup index failed:', err)
  }

  return results
}
