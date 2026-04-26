import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SubmitPage from './pages/SubmitPage'
import AdminPage from './pages/AdminPage'
import GalleryPage from './pages/GalleryPage'
import KidsGalleryPage from './pages/KidsGalleryPage'
import NotFoundPage from './pages/NotFoundPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/memories" replace />} />
        <Route path="/memories" element={<GalleryPage />} />
        <Route path="/kids" element={<KidsGalleryPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
