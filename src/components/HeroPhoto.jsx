import React, { useState, useEffect } from 'react'
import './HeroPhoto.css'

export default function HeroPhoto() {
  const [photoUrl, setPhotoUrl] = useState(null)

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        const url = data.hero_photo || data.url || null
        if (url) setPhotoUrl(url)
      })
      .catch(() => {})
  }, [])

  if (!photoUrl) return null

  return (
    <div className="hero-photo-wrap">
      <div className="hero-photo-frame">
        <img src={photoUrl} alt="Jamie" className="hero-photo-img" />
      </div>
    </div>
  )
}
