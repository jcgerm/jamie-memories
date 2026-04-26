import { useEffect } from 'react'
import './Lightbox.css'

export default function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>

      {photos.length > 1 && (
        <div className="lightbox-counter">{index + 1} / {photos.length}</div>
      )}

      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <img src={photos[index]} alt="" className="lightbox-img" />
      </div>

      {hasPrev && (
        <button className="lightbox-arrow lightbox-prev" onClick={e => { e.stopPropagation(); onPrev() }} aria-label="Previous" />
      )}
      {hasNext && (
        <button className="lightbox-arrow lightbox-next" onClick={e => { e.stopPropagation(); onNext() }} aria-label="Next" />
      )}
    </div>
  )
}
