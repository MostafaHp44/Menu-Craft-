import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from './components/ui'
import Admin from './pages/Admin'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DesignBranding from './pages/dashboard/DesignBranding'
import MyMenu from './pages/dashboard/MyMenu'
import Overview from './pages/dashboard/Overview'
import QrCodePage from './pages/dashboard/QrCodePage'
import SettingsPage from './pages/dashboard/SettingsPage'
import DashboardTemplates from './pages/dashboard/TemplatesPage'
import SubscriptionPage from './pages/dashboard/SubscriptionPage'
import Editor from './pages/Editor'
import Home from './pages/Home'
import MenuDemo from './pages/MenuDemo'
import NotFound from './pages/NotFound'
import SignIn from './pages/SignIn'
import TemplatePreview from './pages/TemplatePreview'
import Templates from './pages/Templates'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        const timer = window.setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 60)
        return () => window.clearTimeout(timer)
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:id" element={<TemplatePreview />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard/editor" element={<Editor />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Overview />} />
          <Route path="menu" element={<MyMenu />} />
          <Route path="design" element={<DesignBranding />} />
          <Route path="templates" element={<DashboardTemplates />} />
          <Route path="qr-code" element={<QrCodePage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/menu-demo" element={<MenuDemo />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
