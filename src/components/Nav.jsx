import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Nav.css'

export default function Nav({ primaryAction }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <nav className="site-nav" ref={navRef}>
      <div className="site-nav-inner">
        <Link to="/" className="nav-logo">Remembering Jamie</Link>
        <div className="nav-links">
          {primaryAction}
          <button
            className={`nav-hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
      <div className={`nav-dropdown${menuOpen ? ' nav-dropdown--open' : ''}`}>
        <a
          href="https://www.sollevinson.com/memorials/jamie-krusinsky/5704663/"
          target="_blank"
          rel="noreferrer"
          className="nav-dropdown-link"
          onClick={() => setMenuOpen(false)}
        >
          Celebration of life
        </a>
        <a
          href="https://mcpsmd.schoolcashonline.com/Fee/Details/116448/354/False/True"
          target="_blank"
          rel="noreferrer"
          className="nav-dropdown-link nav-dropdown-link--donate"
          onClick={() => setMenuOpen(false)}
        >
          Donate to the Jamie Krusinski Softball Scholarship
        </a>
      </div>
    </nav>
  )
}
