import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { I18nProvider } from './shared/i18n'
import { Toaster } from './shared/ui/ui.tsx'
import Admin from './features/admin/Admin.tsx'
import DashboardLayout from './features/client/DashboardLayout.tsx'
import DesignBranding from './features/client/DesignBranding.tsx'
import EarningsPage from './features/client/EarningsPage.tsx'
import MyMenu from './features/client/MyMenu.tsx'
import OrdersPage from './features/client/OrdersPage.tsx'
import Overview from './features/client/Overview.tsx'
import PaymentsPage from './features/client/PaymentsPage.tsx'
import ReportsPage from './features/client/ReportsPage.tsx'
import QrCodePage from './features/client/QrCodePage.tsx'
import SettingsPage from './features/client/SettingsPage.tsx'
import TeamPage from './features/client/TeamPage.tsx'
import DashboardTemplates from './features/client/TemplatesPage.tsx'
import SubscriptionPage from './features/client/SubscriptionPage.tsx'
import Editor from './features/client/Editor.tsx'
import Home from './features/marketing/Home.tsx'
import MenuDemo from './features/marketing/MenuDemo.tsx'
import NotFound from './features/marketing/NotFound.tsx'
import SignIn from './features/auth/SignIn.tsx'
import WorkerBoard from './features/worker/WorkerBoard.tsx'
import TemplatePreview from './features/marketing/TemplatePreview.tsx'
import Templates from './features/marketing/Templates.tsx'

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
    <I18nProvider>
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
            <Route path="orders" element={<OrdersPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="menu" element={<MyMenu />} />
            <Route path="design" element={<DesignBranding />} />
            <Route path="templates" element={<DashboardTemplates />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="qr-code" element={<QrCodePage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
          <Route path="/menu-demo" element={<MenuDemo />} />
          <Route path="/worker" element={<WorkerBoard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
