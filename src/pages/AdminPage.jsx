import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AdminPage.css'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [submissions, setSubmissions] = useState([])
  const [filter, setFilter] = useState('pending') // pending | approved | all
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null) // full detail view

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
    let query = supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('approved', false)
    if (filter === 'approved') query = query.eq('approved', true)

    const { data, error } = await query
    if (!error) setSubmissions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchSubmissions()
  }, [authed, filter])

  const approve = async (id) => {
    await supabase.from('submissions').update({ approved: true }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, approved: true } : s))
    if (selected?.id === id) setSelected(prev => ({ ...prev, approved: true }))
    if (filter === 'pending') setSubmissions(prev => prev.filter(s => s.id !== id))
  }

  const reject = async (id) => {
    if (!confirm('Delete this submission permanently?')) return
    await supabase.from('submissions').delete().eq('id', id)
    setSubmissions(prev => prev.filter(s => s.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const getPhotoUrl = (path) => {
    const { data } = supabase.storage.from('memories-photos').getPublicUrl(path)
    return data.publicUrl
  }

  const forKidsLabel = (v) => ({ yes: 'For the girls', both: 'Everyone', no: 'Adults only' }[v] || v)
  const forKidsBadgeClass = (v) => ({ yes: 'badge-green', both: 'badge-tan', no: 'badge-red' }[v] || '')

  if (!authed) {
    return (
      <div className="admin-login">
        <h1>Jamie Memories</h1>
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
          <h2>Jamie Memories</h2>
          <p>Admin</p>
        </div>

        <div className="filter-tabs">
          {['pending', 'approved', 'all'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="submission-list">
          {loading && <p className="admin-loading">Loading…</p>}
          {!loading && submissions.length === 0 && (
            <p className="admin-empty">No {filter} submissions.</p>
          )}
          {submissions.map(s => (
            <div
              key={s.id}
              className={`submission-card ${selected?.id === s.id ? 'active' : ''}`}
              onClick={() => setSelected(s)}
            >
              <div className="sc-header">
                <span className="sc-name">{s.submitter_name}</span>
                <span className={`badge ${forKidsBadgeClass(s.for_kids)}`}>{forKidsLabel(s.for_kids)}</span>
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
            <p>Select a submission to review</p>
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
