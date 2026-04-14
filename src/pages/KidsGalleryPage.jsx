import React, { useState, useEffect } from 'react'
import './GalleryPage.css'
import './KidsGalleryPage.css'
import HeroPhoto from '../components/HeroPhoto'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function KidsGalleryPage() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  const loadMemories = (showLoading = true) => {
    if (showLoading) setLoading(true)
    fetch('/api/gallery-kids', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setMemories(Array.isArray(data) ? data : [])
        if (showLoading) setLoading(false)
      })
      .catch(() => {
        setError('Could not load memories. Please try again.')
        if (showLoading) setLoading(false)
      })
  }

  useEffect(() => {
    loadMemories()
    const onVisible = () => { if (document.visibilityState === 'visible') loadMemories(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const getPhotoUrl = (path) =>
    `${SUPABASE_URL}/storage/v1/object/public/memories-photos/${path}`

  const getInitials = (name) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const getVideoEmbedUrl = (link) => {
    if (!link) return null
    const ytMatch = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const vimeoMatch = link.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return null
  }

  return (
    <div className="gallery-page kids-page">
      <header className="kids-hero">
        <HeroPhoto />
        <div className="kids-hero-ornament">✦</div>
        <h1 className="kids-hero-title">For Maya & Sadie</h1>
        <p className="kids-hero-sub">
          These are memories written just for you — from people who loved your mom
          and want you to know who she was.
        </p>
        {!loading && !error && (
          <p className="gallery-count">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} for you
          </p>
        )}
      </header>

      <main className="gallery-main">
        {loading && (
          <div className="gallery-loading">
            <div className="gallery-loading-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {error && <p className="gallery-error">{error}</p>}

        {!loading && !error && memories.length === 0 && (
          <div className="gallery-empty">
            <p>Memories are being gathered for you. Check back soon.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="feed">
            {memories.map(m => {
              const isLong = m.memory?.length > 400
              const isExpanded = expanded[m.id]
              const displayText = isLong && !isExpanded
                ? m.memory.slice(0, 400).trimEnd() + '…'
                : m.memory

              return (
                <article key={m.id} className="feed-card">
                  <div className="feed-card-header">
                    <div className="feed-avatar kids-avatar">{getInitials(m.submitter_name)}</div>
                    <div className="feed-meta">
                      <div className="feed-name">{m.submitter_name}</div>
                      {m.relationship && <div className="feed-rel">{m.relationship}</div>}
                    </div>
                    <div className="feed-date">{formatDate(m.created_at)}</div>
                  </div>

                  <div className="feed-memory">
                    <p>"{displayText}"</p>
                    {isLong && (
                      <button className="feed-expand" onClick={() => toggleExpand(m.id)}>
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  {m.photo_paths?.length > 0 && (
                    <div className={`feed-photos count-${Math.min(m.photo_paths.length, 4)}`}>
                      {m.photo_paths.slice(0, 4).map((path, i) => (
                        <a key={i} href={getPhotoUrl(path)} target="_blank" rel="noreferrer" className="feed-photo-link">
                          <img src={getPhotoUrl(path)} alt="" className="feed-photo" loading="lazy" />
                          {i === 3 && m.photo_paths.length > 4 && (
                            <div className="feed-photo-more">+{m.photo_paths.length - 4}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {m.video_uids?.length > 0 && (
                    <div className="feed-videos">
                      {m.video_uids.map((uid, i) => (
                        <div key={i} className="feed-video">
                          <iframe
                            src={`https://iframe.cloudflarestream.com/${uid}`}
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                            title={`Video from ${m.submitter_name}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {m.video_link && !m.video_uids?.length && (() => {
                    const embedUrl = getVideoEmbedUrl(m.video_link)
                    return embedUrl ? (
                      <div className="feed-videos">
                        <div className="feed-video">
                          <iframe
                            src={embedUrl}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`Video from ${m.submitter_name}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="feed-video-link">
                        <a href={m.video_link} target="_blank" rel="noreferrer">Watch video →</a>
                      </div>
                    )
                  })()}
                </article>
              )
            })}
          </div>
        )}
      </main>

      <footer className="gallery-footer">
        <p className="kids-footer-note">With love, from everyone who knew her</p>
        <p className="gallery-footer-note">Remembering Jamie</p>
      </footer>
    </div>
  )
}
