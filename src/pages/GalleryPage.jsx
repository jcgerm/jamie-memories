import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './GalleryPage.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function GalleryPage() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({}) // track which long memories are expanded

  useEffect(() => {
    fetch('/.netlify/functions/gallery')
      .then(r => r.json())
      .then(data => {
        setMemories(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        setError('Could not load memories. Please try again.')
        setLoading(false)
      })
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
    <div className="gallery-page">
      <nav className="gallery-nav">
        <div className="gallery-nav-inner">
          <Link to="/" className="nav-logo">Jamie Memories</Link>
          <Link to="/submit" className="nav-submit-btn">Share a memory</Link>
        </div>
      </nav>

      <header className="gallery-hero">
        <div className="gallery-hero-ornament">✦</div>
        <h1 className="gallery-hero-title">Memories</h1>
        <p className="gallery-hero-sub">
          Stories, moments, and glimpses of who Jamie was — shared by the people who loved her.
        </p>
        {!loading && !error && (
          <p className="gallery-count">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} shared
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
            <p>No memories have been shared yet.</p>
            <Link to="/submit" className="gallery-empty-link">Be the first to share one →</Link>
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
                    <div className="feed-avatar">{getInitials(m.submitter_name)}</div>
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

                  {/* Photos */}
                  {m.photo_paths?.length > 0 && (
                    <div className={`feed-photos count-${Math.min(m.photo_paths.length, 4)}`}>
                      {m.photo_paths.slice(0, 4).map((path, i) => (
                        <a
                          key={i}
                          href={getPhotoUrl(path)}
                          target="_blank"
                          rel="noreferrer"
                          className="feed-photo-link"
                        >
                          <img
                            src={getPhotoUrl(path)}
                            alt=""
                            className="feed-photo"
                            loading="lazy"
                          />
                          {i === 3 && m.photo_paths.length > 4 && (
                            <div className="feed-photo-more">+{m.photo_paths.length - 4}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Cloudflare Stream videos */}
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

                  {/* YouTube / Vimeo link embeds */}
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
                        <a href={m.video_link} target="_blank" rel="noreferrer">
                          Watch video →
                        </a>
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
        <Link to="/submit" className="gallery-footer-cta">
          Share your own memory of Jamie →
        </Link>
        <p className="gallery-footer-note">Jamie Memories · Made with love</p>
      </footer>
    </div>
  )
}
