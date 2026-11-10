import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { I18nProvider } from './shared/i18n'
import { Toaster } from './shared/ui/ui.tsx'
import Admin from './features/admin/Admin.tsx'
import SubscriptionRequestsPage from './features/admin/SubscriptionRequestsPage.tsx'
import RevenuePage from './features/admin/RevenuePage.tsx'
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
import BranchesPage from './features/client/BranchesPage.tsx'
import TeamPage from './features/client/TeamPage.tsx'
import DashboardTemplates from './features/client/TemplatesPage.tsx'
import MyTemplatesPage from './features/client/MyTemplatesPage.tsx'
import WebsitesPage from './features/client/WebsitesPage.tsx'
import SubscriptionPage from './features/client/SubscriptionPage.tsx'
import Editor from './features/client/Editor.tsx'
import Home from './features/marketing/Home.tsx'
import MenuDemo from './features/marketing/MenuDemo.tsx'
import NotFound from './features/marketing/NotFound.tsx'
import SignIn from './features/auth/SignIn.tsx'
import WorkerBoard from './features/worker/WorkerBoard.tsx'
import TemplatePreview from './features/marketing/TemplatePreview.tsx'
import Templates from './features/marketing/Templates.tsx'
import LiveLayout, { RoleGate, WorkspaceHome } from './features/live/LiveLayout.tsx'
import LiveLogin from './features/live/LiveLogin.tsx'
import LiveOverview from './features/live/OverviewPage.tsx'
import LiveOrders from './features/live/OrdersPage.tsx'
import LiveBranches from './features/live/BranchesPage.tsx'
import LiveTeam from './features/live/TeamPage.tsx'
import LiveAudit from './features/live/AuditPage.tsx'
import LiveKitchen from './features/live/KitchenPage.tsx'
import LiveWaiter from './features/live/WaiterPage.tsx'
import LiveSites from './features/live/SitesPage.tsx'
import LiveSubscription from './features/live/SubscriptionPage.tsx'
import LiveAccount from './features/live/AccountPage.tsx'
import PublicSitePage from './features/public/PublicSitePage.tsx'
import PublicTrackingPage from './features/public/OrderTrackingPage.tsx'
import { useBackendAuth } from './shared/store/useBackendAuth.ts'
import AdminLogin from './features/admin/AdminLogin.tsx'
import { AdminGate, PanelGate } from './shared/auth/panels.tsx'

function BackendSessionBootstrap() {
  useEffect(() => {
    void useBackendAuth.getState().refresh()
  }, [])
  return null
}
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
        <BackendSessionBootstrap />
        <ScrollToTop />
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<TemplatePreview />} />
          <Route path="/signin" element={<SignIn />} />
          {/* المحرر البصري — متاح للجيست كتجربة (التسجيل بيظهر فقط عند الـ Publish
              عبر AuthModal داخل المحرر)، والداشبورد نفسه بيظل محمي بـ PanelGate */}
          <Route path="/dashboard/editor" element={<Editor />} />
          {/* الموقع العام للزائر (مطعم منشور عبر slug) */}
          <Route path="/site/:slug" element={<PublicSitePage />} />
          {/* تتبع الطلب للضيف برمز التتبع الآمن */}
          <Route path="/orders/:id" element={<PublicTrackingPage />} />
{/* لوحة الكلاينت (أصحاب المطاعم) — لا يدخلها غيرهم */}
<Route path="/dashboard" element={
              <PanelGate panel="client">
                <DashboardLayout />
              </PanelGate>
            }>
            <Route index element={<Overview />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="menu" element={<MyMenu />} />
            <Route path="design" element={<DesignBranding />} />
            <Route path="templates" element={<DashboardTemplates />} />
            <Route path="my-templates" element={<MyTemplatesPage />} />
            <Route path="websites" element={<WebsitesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="qr-code" element={<QrCodePage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="branches" element={<BranchesPage />} />
          </Route>
          <Route path="/menu-demo" element={<MenuDemo />} />
          <Route path="/workspace/login" element={<LiveLogin />} />
          {/* لوحة السوبر أدمن — لا يدخلها غيره */}
          <Route
            path="/admin/subscription-requests"
            element={
              <AdminGate>
                <SubscriptionRequestsPage />
              </AdminGate>
            }
          />
          <Route
            path="/admin/revenue"
            element={
              <AdminGate>
                <RevenuePage />
              </AdminGate>
            }
          />
           {/* لوحة الموظفين (كاشير/مطبخ/نادل) — لا يدخلها غيرهم */}
            <Route path="/workspace" element={
              <PanelGate panel="staff">
                <LiveLayout />
              </PanelGate>
            }>
            <Route index element={<WorkspaceHome />} />
            <Route
              path="overview"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveOverview />
                </RoleGate>
              }
            />
            <Route
              path="orders"
              element={
                <RoleGate roles={['Owner', 'Cashier']}>
                  <LiveOrders />
                </RoleGate>
              }
            />
            <Route
              path="branches"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveBranches />
                </RoleGate>
              }
            />
            <Route
              path="team"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveTeam />
                </RoleGate>
              }
            />
            <Route
              path="audit"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveAudit />
                </RoleGate>
              }
            />
            <Route
              path="kitchen"
              element={
                <RoleGate roles={['Owner', 'Kitchen']}>
                  <LiveKitchen />
                </RoleGate>
              }
            />
            <Route
              path="waiter"
              element={
                <RoleGate roles={['Owner', 'Waiter']}>
                  <LiveWaiter />
                </RoleGate>
              }
            />
            <Route
              path="sites"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveSites />
                </RoleGate>
              }
            />
            <Route
              path="subscription"
              element={
                <RoleGate roles={['Owner']}>
                  <LiveSubscription />
                </RoleGate>
              }
            />
            <Route path="account" element={<LiveAccount />} />
          </Route>
          <Route
            path="/worker"
            element={
              <PanelGate panel="client">
                <WorkerBoard />
              </PanelGate>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
