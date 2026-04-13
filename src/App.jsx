import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import './App.css'

const MAX_PHOTO_MB = 20
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024

function App() {
  const [step, setStep] = useState('form') // form | uploading | success | error
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    submitterName: '',
    relationship: '',
    memory: '',
    forKids: 'both', // 'yes' | 'no' | 'both'
    videoLink: '',
  })

  const [photos, setPhotos] = useState([]) // { file, preview }[]
  const [videos, setVideos] = useState([]) // { file, name }[]

  // Photo drop
  const onPhotoDrop = useCallback((accepted, rejected) => {
    const valid = accepted.filter(f => f.size <= MAX_PHOTO_BYTES)
    const tooLarge = accepted.filter(f => f.size > MAX_PHOTO_BYTES)
    if (tooLarge.length) alert(`${tooLarge.length} photo(s) were over ${MAX_PHOTO_MB}MB and skipped.`)
    const newPhotos = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 20))
  }, [])

  const { getRootProps: getPhotoRootProps, getInputProps: getPhotoInputProps, isDragActive: isPhotoDragActive } = useDropzone({
    onDrop: onPhotoDrop,
    accept: { 'image/*': [] },
    multiple: true,
  })

  // Video drop
  const onVideoDrop = useCallback((accepted) => {
    const newVideos = accepted.map(f => ({ file: f, name: f.name }))
    setVideos(prev => [...prev, ...newVideos].slice(0, 3))
  }, [])

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': [] },
    multiple: true,
  })

  const removePhoto = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const removeVideo = (idx) => setVideos(prev => prev.filter((_, i) => i !== idx))

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const uploadPhoto = async (file, submissionId, index) => {
    const compressed = await compressImage(file, 1920)
    const ext = file.name.split('.').pop()
    const path = `${submissionId}/photo_${index}.${ext}`

    // Convert to base64 and send through serverless function
    const base64 = await blobToBase64(compressed)
    const res = await fetch('/.netlify/functions/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, contentType: file.type, path }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Photo upload failed')
    }
    return path
  }

  const uploadVideo = async (file) => {
    // Get a direct upload URL from our Netlify function
    setProgressLabel('Getting video upload URL…')
    const res = await fetch('/.netlify/functions/get-stream-upload-url', { method: 'POST' })
    if (!res.ok) throw new Error('Could not get video upload URL')
    const { uploadURL, uid } = await res.json()

    setProgressLabel(`Uploading video: ${file.name}…`)
    const uploadRes = await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) {
      throw new Error(`Video upload failed (status: ${uploadRes.status})`)
    }
    return uid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.submitterName.trim() || !form.memory.trim()) {
      alert('Please fill in your name and a memory.')
      return
    }

    setStep('uploading')
    setProgress(0)

    try {
      // 1. Insert submission record via serverless function (uses service role key)
      setProgressLabel('Saving your memory…')
      const subRes = await fetch('/.netlify/functions/create-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitterName: form.submitterName.trim(),
          relationship: form.relationship.trim(),
          memory: form.memory.trim(),
          forKids: form.forKids,
          videoLink: form.videoLink.trim(),
        }),
      })
      if (!subRes.ok) {
        const err = await subRes.json()
        throw new Error(err.error || 'Failed to save submission')
      }
      const { id: submissionId } = await subRes.json()
      setProgress(10)

      // 2. Upload photos via serverless function
      const photoPaths = []
      for (let i = 0; i < photos.length; i++) {
        setProgressLabel(`Uploading photo ${i + 1} of ${photos.length}…`)
        const path = await uploadPhoto(photos[i].file, submissionId, i)
        photoPaths.push(path)
        setProgress(10 + Math.round(((i + 1) / Math.max(photos.length, 1)) * 60))
      }

      // 3. Upload videos via Cloudflare Stream
      const videoUids = []
      for (let i = 0; i < videos.length; i++) {
        setProgressLabel(`Uploading video ${i + 1} of ${videos.length}… (this may take a while)`)
        const uid = await uploadVideo(videos[i].file)
        videoUids.push(uid)
        setProgress(70 + Math.round(((i + 1) / Math.max(videos.length, 1)) * 25))
      }

      // 4. Update submission with media paths via serverless function
      setProgressLabel('Finishing up…')
      await fetch('/.netlify/functions/update-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, photoPaths, videoUids }),
      })

      setProgress(100)
      setStep('success')
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStep('error')
    }
  }

  if (step === 'uploading') return <UploadingScreen progress={progress} label={progressLabel} />
  if (step === 'success') return <SuccessScreen onAnother={() => { setStep('form'); setForm({ submitterName: '', relationship: '', memory: '', forKids: 'both', videoLink: '' }); setPhotos([]); setVideos([]) }} />
  if (step === 'error') return <ErrorScreen message={errorMsg} onBack={() => setStep('form')} />

  return (
    <div className="page">
      <nav className="submit-nav">
        <div className="submit-nav-inner">
          <Link to="/memories" className="nav-logo">Jamie Memories</Link>
          <Link to="/memories" className="nav-gallery-btn">View memories</Link>
        </div>
      </nav>
      <header className="hero">
        <div className="hero-ornament">✦</div>
        <h1 className="hero-title">Share a Memory</h1>
        <p className="hero-subtitle">
          Share a photo, a story, a moment — something that captures who Jamie was to you.
          These memories will be treasured by her daughters as they grow up.
        </p>
      </header>

      <form className="memory-form" onSubmit={handleSubmit}>

        <section className="form-section">
          <label className="field-label">Your name <span className="required">*</span></label>
          <input
            className="field-input"
            name="submitterName"
            value={form.submitterName}
            onChange={handleChange}
            placeholder="How you'd like to be remembered"
            required
          />
        </section>

        <section className="form-section">
          <label className="field-label">Your relationship to Jamie</label>
          <input
            className="field-input"
            name="relationship"
            value={form.relationship}
            onChange={handleChange}
            placeholder="e.g. college roommate, coworker, sister-in-law…"
          />
        </section>

        <section className="form-section">
          <label className="field-label">Your memory <span className="required">*</span></label>
          <textarea
            className="field-textarea"
            name="memory"
            value={form.memory}
            onChange={handleChange}
            placeholder="Tell a story, describe who she was, share something funny or beautiful or ordinary. There's no wrong answer."
            rows={7}
            required
          />
          <p className="field-hint">Write as much or as little as you'd like. Her daughters will read this someday.</p>
        </section>

        <section className="form-section">
          <label className="field-label">Who is this memory for?</label>
          <div className="radio-group">
            {[
              { value: 'yes', label: 'Her daughters (age-appropriate)', desc: 'Shown to the girls when they\'re ready' },
              { value: 'both', label: 'Everyone', desc: 'Visible to family and friends' },
              { value: 'no', label: 'Adults only', desc: 'Not shown to the girls — for the fuller picture' },
            ].map(opt => (
              <label key={opt.value} className={`radio-card ${form.forKids === opt.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="forKids"
                  value={opt.value}
                  checked={form.forKids === opt.value}
                  onChange={handleChange}
                />
                <div>
                  <div className="radio-label">{opt.label}</div>
                  <div className="radio-desc">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <label className="field-label">Photos</label>
          <div {...getPhotoRootProps()} className={`dropzone ${isPhotoDragActive ? 'active' : ''}`}>
            <input {...getPhotoInputProps()} />
            <div className="dropzone-inner">
              <div className="dropzone-icon">◎</div>
              <p className="dropzone-text">Drop photos here, or tap to choose</p>
              <p className="dropzone-hint">Up to 20 photos · {MAX_PHOTO_MB}MB each max</p>
            </div>
          </div>
          {photos.length > 0 && (
            <div className="photo-grid">
              {photos.map((p, i) => (
                <div key={i} className="photo-thumb">
                  <img src={p.preview} alt="" />
                  <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <label className="field-label">Videos</label>
          <div {...getVideoRootProps()} className={`dropzone ${isVideoDragActive ? 'active' : ''}`}>
            <input {...getVideoInputProps()} />
            <div className="dropzone-inner">
              <div className="dropzone-icon">▷</div>
              <p className="dropzone-text">Drop video files here, or tap to choose</p>
              <p className="dropzone-hint">Up to 3 videos · any format · large files are fine</p>
            </div>
          </div>
          {videos.length > 0 && (
            <div className="video-list">
              {videos.map((v, i) => (
                <div key={i} className="video-item">
                  <span className="video-icon">▷</span>
                  <span className="video-name">{v.name}</span>
                  <button type="button" className="video-remove" onClick={() => removeVideo(i)}>×</button>
                </div>
              ))}
            </div>
          )}
          <p className="field-hint">Or paste a YouTube / Google Drive link instead:</p>
          <input
            className="field-input"
            name="videoLink"
            value={form.videoLink}
            onChange={handleChange}
            placeholder="https://youtube.com/..."
          />
        </section>

        <div className="form-footer">
          <button type="submit" className="submit-btn">
            Share this memory
          </button>
          <p className="form-note">
            Your submission will be reviewed before it's added to the archive.
          </p>
        </div>

      </form>

      <footer className="page-footer">
        <p>Jamie Memories · Made with love</p>
      </footer>
    </div>
  )
}

function UploadingScreen({ progress, label }) {
  return (
    <div className="status-screen">
      <div className="status-ornament">◎</div>
      <h2>Saving your memory…</h2>
      <p className="status-label">{label}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="status-pct">{progress}%</p>
    </div>
  )
}

function SuccessScreen({ onAnother }) {
  return (
    <div className="status-screen fade-up">
      <div className="status-ornament success">✦</div>
      <h2>Thank you</h2>
      <p className="status-message">
        Your memory has been received. Once it's reviewed, it will join the others in the archive — 
        something her daughters will carry with them always.
      </p>
      <button className="submit-btn" onClick={onAnother}>Share another memory</button>
    </div>
  )
}

function ErrorScreen({ message, onBack }) {
  return (
    <div className="status-screen fade-up">
      <div className="status-ornament error">✕</div>
      <h2>Something went wrong</h2>
      <p className="status-message">{message}</p>
      <button className="submit-btn" onClick={onBack}>Go back and try again</button>
    </div>
  )
}

// Convert blob to base64 string for serverless function transport
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Compress image client-side before upload
async function compressImage(file, maxDimension) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width <= maxDimension && height <= maxDimension) {
        resolve(file)
        return
      }
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.88)
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

export default App
