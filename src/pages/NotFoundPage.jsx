import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import './NotFoundPage.css'

export default function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <div className="notfound-page">
      <p className="notfound-ornament">✦</p>
      <h1 className="notfound-title">Page not found</h1>
      <p className="notfound-sub">The page you're looking for doesn't exist.</p>
      <Link to="/memories" className="notfound-link">Back to memories →</Link>
    </div>
  )
}
