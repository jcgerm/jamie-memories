import React, { useState, useEffect, useRef } from 'react'
import './AdminPage.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)

  // Multi-select state
  const [checked, setChecked] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Hero photo state
  const [heroUrl, setHeroUrl] = useState(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const heroInputRef = useRef(null)

  useEffect(() => {
    if (authed) {
      fetch('/.netlify/functions/site-settings')
        .then(r => r.json())
        .then(data => { if (data.url) setHeroUrl(data.url) })
        .catch(() => {})
    }
  }, [authed])

  const uploadHero = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHeroUploading(true)
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/.netlify/functions/upload-hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, base64, contentType: file.type }),
      })
      const data = await resp.json()
      if (data.url) setHeroUrl(data.url)
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setHeroUploading(false)
  }

  const login = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setPwError(true)
      setTimeout(() => setPwError(false), 2000)
    }
  }

  const fetchSubmissions = async () => {
    setLoading(true)
    setChecked(new Set())
    try {
      const res = await fetch('/.netlify/functions/admin-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, filter }),
      })
      const data = await res.json()
      setSubmissions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchSubmissions()
  }, [authed, filter])

  const approve = async (id) => {
    await fetch('/.netlify/functions/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD, action: 'approve', id }),
    })
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s))
    if (selected?.id === id) setSelected(prev => ({ ...prev, approved: true }))
    if (filter === 'pending') setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  const reject = async (id) => {
    if (!confirm('Delete this submission permanently?')) return
    await fetch('/.netlify/functions/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: ADMIN_PASSWORD, action: 'delete', id }),
    })
    setSubmissions(prev => prev.filter(s => s.id !== id))
    if (selected?.id === id) setSelected(null)
    setChecked(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const bulkDelete = async () => {
    if (checked.size === 0) return
    if (!confirm(`Permanently delete ${checked.size} submission${checked.size > 1 ? 's' : ''}?`)) return
    setBulkDeleting(true)
    await Promise.all([...checked].map(id =>
      fetch('/.netlify/functions/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, action: 'delete', id }),
      })
    ))
    setSubmissions(prev => prev.filter(s => !checked.has(s.id)))
    if (checked.has(selected?.id)) setSelected(null)
    setChecked(new Set())
    setBulkDeleting(false)
  }

  const toggleCheck = (e, id) => {
    e.stopPropagation()
    setChecked(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleAll = () => {
    if (checked.size === submissions.length) {
      setChecked(new Set())
    } else {
      setChecked(new Set(submissions.map(s => s.id)))
    }
  }

  const allChecked = submissions.length > 0 && checked.size === submissions.length
  const someChecked = checked.size > 0 && checked.size < submissions.length

  const getPhotoUrl = (path) =>
    `${SUPABASE_URL}/storage/v1/object/public/memories-photos/${path}`

  const forKidsLabel = (v) => ({ yes: 'For Maya and Sadie', both: 'Everyone', no: 'Adults only' }[v] || v)
  const forKidsBadgeClass = (v) => ({ yes: 'badge-green', both: 'badge-tan', no: 'badge-red' }[v] || 'badge-tan')

  if (!authed) {
    return (
      <div className="admin-login">
        <h1>Remembering Jamie</h1>
        <p className="admin-login-sub">Admin access</p>
        <form onSubmit={login} className="login-form">
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            className={`field-input ${pwError ? 'error' : ''}`}
            autoFocus
          />
          <button type="submit" className="submit-btn">Enter</button>
          {pwError && <p className="login-error">Incorrect password</p>}
        </form>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <h2>Remembering Jamie</h2>
          <p>Admin</p>
        </div>

        <div className="hero-upload-section">
          <div className="hero-upload-preview" onClick={() => heroInputRef.current?.click()}>
            {heroUrl
              ? <img src={heroUrl} alt="Jamie" className="hero-upload-img" />
              : <div className="hero-upload-placeholder">
                  <span className="hero-upload-icon">+</span>
                  <span className="hero-upload-label">Add photo of Jamie</span>
                </div>
            }
            <div className="hero-upload-overlay">
              {heroUploading ? 'Uploading…' : 'Change photo'}
            </div>
          </div>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={uploadHero}
          />
          <p className="hero-upload-hint">Shown at the top of the gallery</p>
        </div>

        <div className="filter-tabs">
          {['pending', 'approved', 'all'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => { setFilter(f); setChecked(new Set()) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk action toolbar */}
        {submissions.length > 0 && (
          <div className="bulk-toolbar">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={allChecked}
                ref={el => { if (el) el.indeterminate = someChecked }}
                onChange={toggleAll}
                className="bulk-checkbox"
              />
              <span className="select-all-text">
                {checked.size > 0 ? `${checked.size} selected` : 'Select all'}
              </span>
            </label>
            {checked.size > 0 && (
              <button
                className="bulk-delete-btn"
                onClick={bulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? 'Deleting…' : `Delete ${checked.size}`}
              </button>
            )}
          </div>
        )}

        <div className="submission-list">
          {loading && <p className="admin-loading">Loading…</p>}
          {!loading && submissions.length === 0 && (
            <p className="admin-empty">No {filter} submissions.</p>
          )}
          {submissions.map(s => (
            <div
              key={s.id}
              className={`submission-card ${selected?.id === s.id ? 'active' : ''} ${checked.has(s.id) ? 'checked' : ''}`}
              onClick={() => setSelected(s)}
            >
              <div className="sc-check-row">
                <input
                  type="checkbox"
                  className="bulk-checkbox"
                  checked={checked.has(s.id)}
                  onChange={e => toggleCheck(e, s.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="sc-header">
                  <span className="sc-name">{s.submitter_name}</span>
                  <span className={`badge ${forKidsBadgeClass(s.for_kids)}`}>{forKidsLabel(s.for_kids)}</span>
                </div>
              </div>
              {s.relationship && <p className="sc-rel">{s.relationship}</p>}
              <p className="sc-preview">{s.memory?.slice(0, 100)}{s.memory?.length > 100 ? '…' : ''}</p>
              <p className="sc-date">{new Date(s.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-main">
        {!selected ? (
          <div className="admin-empty-state">
            {checked.size > 0
              ? <p>{checked.size} submission{checked.size > 1 ? 's' : ''} selected</p>
              : <p>Select a submission to review</p>
            }
          </div>
        ) : (
          <div className="submission-detail fade-in">
            <div className="detail-header">
              <div>
                <h2 className="detail-name">{selected.submitter_name}</h2>
                {selected.relationship && <p className="detail-rel">{selected.relationship}</p>}
                <p className="detail-date">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="detail-badges">
                <span className={`badge ${forKidsBadgeClass(selected.for_kids)}`}>{forKidsLabel(selected.for_kids)}</span>
                {selected.approved && <span className="badge badge-approved">Approved</span>}
              </div>
            </div>

            <div className="detail-memory">
              {selected.prompt && (
                <p className="detail-prompt">"{selected.prompt}"</p>
              )}
              <p>{selected.memory}</p>
            </div>

            {selected.photo_paths?.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Photos ({selected.photo_paths.length})</h3>
                <div className="detail-photo-grid">
                  {selected.photo_paths.map((path, i) => (
                    <a key={i} href={getPhotoUrl(path)} target="_blank" rel="noreferrer">
                      <img src={getPhotoUrl(path)} alt="" className="detail-photo" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.video_uids?.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Videos ({selected.video_uids.length})</h3>
                <div className="detail-videos">
                  {selected.video_uids.map((uid, i) => (
                    <div key={i} className="detail-video">
                      <iframe
                        src={`https://iframe.cloudflarestream.com/${uid}`}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title={`Video ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.video_link && (
              <div className="detail-section">
                <h3 className="detail-section-title">Video Link</h3>
                <a href={selected.video_link} target="_blank" rel="noreferrer" className="detail-link">
                  {selected.video_link}
                </a>
              </div>
            )}

            <div className="detail-actions">
              {!selected.approved && (
                <button className="btn-approve" onClick={() => approve(selected.id)}>
                  ✓ Approve
                </button>
              )}
              <button className="btn-reject" onClick={() => reject(selected.id)}>
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
