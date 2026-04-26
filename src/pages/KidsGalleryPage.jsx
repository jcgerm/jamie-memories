import React, { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import './GalleryPage.css'
import './KidsGalleryPage.css'
import HeroPhoto from '../components/HeroPhoto'
import Lightbox from '../components/Lightbox'
import { usePageTitle } from '../hooks/usePageTitle'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function KidsGalleryPage() {
  usePageTitle('For Maya & Sadie')
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(null)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [photoExpanded, setPhotoExpanded] = useState({})
  const [lightbox, setLightbox] = useState(null)
  const feedRef = useRef(null)
  const cardRefs = useRef({})

  const PAGE_SIZE = 10

  const loadMemories = (showLoading = true) => {
    if (showLoading) setLoading(true)
    fetch(`/api/gallery-kids?limit=${PAGE_SIZE}&offset=0`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ items, total: t }) => {
        const page = Array.isArray(items) ? items : []
        setMemories(page)
        setOffset(page.length)
        setTotal(t)
        if (showLoading) setLoading(false)
      })
      .catch(() => {
        setError('Could not load memories. Please try again.')
        if (showLoading) setLoading(false)
      })
  }

  const loadMore = () => {
    setLoadingMore(true)
    fetch(`/api/gallery-kids?limit=${PAGE_SIZE}&offset=${offset}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ items }) => {
        const page = Array.isArray(items) ? items : []
        setMemories(prev => [...prev, ...page])
        setOffset(prev => prev + page.length)
        setLoadingMore(false)
      })
      .catch(() => setLoadingMore(false))
  }

  useEffect(() => {
    loadMemories()
    const onVisible = () => { if (document.visibilityState === 'visible') loadMemories(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Fade-in observer
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    const cards = feed.querySelectorAll('.feed-card')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('feed-card--visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.05 })
    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [memories])

  const getPhotoUrl = (path) =>
    `${SUPABASE_URL}/storage/v1/object/public/memories-photos/${path}`

  const getInitials = (name) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const toggleExpand = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const togglePhotoExpand = (id) =>
    setPhotoExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const collapsePhotos = (id) => {
    flushSync(() => setPhotoExpanded(prev => ({ ...prev, [id]: false })))
    const el = cardRefs.current[id]
    if (!el) return
    const nav = document.querySelector('.gallery-nav')
    const offset = (nav ? nav.offsetHeight : 0) + 12
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' })
  }

  const openLightbox = (photos, index) => setLightbox({ photos, index })
  const closeLightbox = () => setLightbox(null)
  const prevPhoto = () => setLightbox(prev => ({ ...prev, index: prev.index - 1 }))
  const nextPhoto = () => setLightbox(prev => ({ ...prev, index: prev.index + 1 }))

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
          These are memories written just for you — from people who love your mom
          and want you to know who she was.
        </p>
        {!loading && !error && (
          <p className="gallery-count">
            {total} {total === 1 ? 'memory' : 'memories'} for you
          </p>
        )}
      </header>

      <main className="gallery-main">
        {loading && (
          <div className="feed">
            {[0, 1, 2].map(i => (
              <div key={i} className="feed-card feed-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-meta">
                    <div className="skeleton-line skeleton-name" />
                    <div className="skeleton-line skeleton-rel" />
                  </div>
                </div>
                <div className="skeleton-body">
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="gallery-error">{error}</p>}

        {!loading && !error && memories.length === 0 && (
          <div className="gallery-empty">
            <p>Memories are being gathered for you. Check back soon.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="feed" ref={feedRef}>
            {memories.map(m => {
              const isLong = m.memory?.length > 400
              const isExpanded = expanded[m.id]
              const displayText = isLong && !isExpanded
                ? m.memory.slice(0, 400).trimEnd() + '…'
                : m.memory

              return (
                <article key={m.id} className="feed-card" ref={el => cardRefs.current[m.id] = el}>
                  <div className="feed-card-header">
                    <div className="feed-avatar kids-avatar">{getInitials(m.submitter_name)}</div>
                    <div className="feed-meta">
                      <div className="feed-name">{m.submitter_name}</div>
                      {m.relationship && <div className="feed-rel">{m.relationship}</div>}
                    </div>
                    <div className="feed-date">{formatDate(m.created_at)}</div>
                  </div>

                  <div className="feed-memory">
                    {m.prompt && <p className="feed-prompt">"{m.prompt}"</p>}
                    <p>"{displayText}"</p>
                    {isLong && (
                      <button className="feed-expand" onClick={() => toggleExpand(m.id)}>
                        {isExpanded ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  {m.photo_paths?.length > 0 && (() => {
                    const isPhotoExpanded = photoExpanded[m.id]
                    const visiblePhotos = isPhotoExpanded ? m.photo_paths : m.photo_paths.slice(0, 4)
                    const overflow = m.photo_paths.length - 4
                    return (
                      <div className={`feed-photos count-${Math.min(m.photo_paths.length, 4)}`}>
                        {visiblePhotos.map((path, i) => (
                          <div
                            key={i}
                            className="feed-photo-link"
                            onClick={() => openLightbox(m.photo_paths.map(getPhotoUrl), i)}
                          >
                            <img src={getPhotoUrl(path)} alt="" className="feed-photo" loading="lazy" />
                            {i === 3 && overflow > 0 && !isPhotoExpanded && (
                              <div
                                className="feed-photo-more"
                                onClick={e => { e.stopPropagation(); togglePhotoExpand(m.id) }}
                              >
                                +{overflow}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {photoExpanded[m.id] && (
                    <button className="photo-collapse-btn" onClick={() => collapsePhotos(m.id)}>
                      Show fewer photos
                    </button>
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
            {total !== null && memories.length < total && (
              <div className="load-more-row">
                <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <span className="load-more-spinner" /> : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="gallery-footer">
        <p className="kids-footer-note">With love, from everyone who knew her</p>
        <p className="gallery-footer-note">Remembering Jamie</p>
      </footer>

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </div>
  )
}
