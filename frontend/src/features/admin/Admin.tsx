import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../../shared/i18n'
import type { TKey } from '../../shared/i18n'
import { Icon, Wordmark } from '../../shared/ui/icons.tsx'
import { Badge, Button } from '../../shared/ui/ui.tsx'
import { LanguageSwitcher } from '../../shared/ui/LanguageSwitcher.tsx'
import { can, isPlatformAdmin, useAuthStore } from '../../shared/store/useAuth.ts'
import type { AdminPermission } from '../../shared/lib/types.ts'
import { cx } from '../../shared/lib/utils.ts'
import { DemoNote, Panel, roleKey } from './parts.tsx'
import ClientsTab from './tabs/ClientsTab.tsx'
import SubscriptionsTab from './tabs/SubscriptionsTab.tsx'
import SalesTab from './tabs/SalesTab.tsx'
import TemplatesTab from './tabs/TemplatesTab.tsx'
import TeamTab from './tabs/TeamTab.tsx'
import PaymentsTab from './tabs/PaymentsTab.tsx'

interface TabDef {
  id: AdminPermission
  labelKey: TKey
  icon: string
}

const TABS: TabDef[] = [
  { id: 'clients', labelKey: 'admin.clients', icon: 'users' },
  { id: 'subscriptions', labelKey: 'admin.subscriptions', icon: 'card' },
  { id: 'sales', labelKey: 'admin.sales', icon: 'chart' },
  { id: 'templates', labelKey: 'admin.templates', icon: 'layers' },
  { id: 'team', labelKey: 'admin.team', icon: 'settings' },
  { id: 'payments', labelKey: 'admin.payments', icon: 'globe' },
]

export default function Admin() {
  const { t } = useI18n()
  const session = useAuthStore((s) => s.session)
  const signInAs = useAuthStore((s) => s.signInAs)
  const [searchParams, setSearchParams] = useSearchParams()

  const authorized = isPlatformAdmin(session) && session?.status === 'active'
  const tabs = authorized ? TABS.filter((tab) => can(session, tab.id)) : []

  const requested = searchParams.get('tab')
  const activeId: AdminPermission =
    requested && tabs.some((tab) => tab.id === requested)
      ? (requested as AdminPermission)
      : (tabs[0]?.id ?? 'clients')
  const focusClientId = searchParams.get('client')

  const goTab = (id: AdminPermission, client?: string | null) => {
    const next = new URLSearchParams()
    next.set('tab', id)
    if (client) next.set('client', client)
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink text-ivory">
      {/* -------------------------------- top bar ------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[62px] max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
          <Wordmark tone="light" markSize={30} />
          <span className="hidden h-5 w-px bg-white/12 sm:block" />
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-semibold text-ivory">{t('admin.title')}</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">
              {t('platformMore.demoBadge')}
            </div>
          </div>

          <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
            {session ? (
              <span className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5 md:inline-flex">
                <span className="max-w-[160px] truncate text-[12px] font-medium text-ivory/85">
                  {session.name}
                </span>
                <Badge tone="flame">{t(roleKey(session.role))}</Badge>
              </span>
            ) : null}
            <LanguageSwitcher tone="dark" />
            <Button to="/dashboard" size="sm" variant="light" icon="home">
              {t('nav.dashboard')}
            </Button>
          </div>
        </div>

        {tabs.length > 0 ? (
          <div className="border-t border-white/8">
            <div className="mx-auto max-w-[1280px] overflow-x-auto px-5 py-2.5 thin-scroll">
              <div
                role="tablist"
                aria-label={t('platformMore.tabsLabel')}
                className="flex w-max min-w-full items-center gap-1.5 rounded-full border border-white/10 bg-smoke p-1.5"
              >
                {tabs.map((tab) => {
                  const active = tab.id === activeId
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => goTab(tab.id)}
                      className={cx(
                        'inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition',
                        active
                          ? 'bg-flame text-white shadow-[0_10px_22px_-14px_rgba(232,87,31,0.9)]'
                          : 'text-ivory/60 hover:bg-white/8 hover:text-ivory'
                      )}
                    >
                      <Icon name={tab.icon} size={15} />
                      {t(tab.labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* -------------------------------- content ------------------------------- */}
      <main className="mx-auto max-w-[1280px] px-5 py-8">
        {!authorized || tabs.length === 0 ? (
          <Panel className="mx-auto max-w-xl text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-flame-light">
              <Icon name="settings" size={22} />
            </span>
            <h2 className="display-serif mt-4 text-[22px] leading-tight text-ivory">
              {t('platformMore.access.signInTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ivory/60">
              {authorized ? t('platformMore.access.noPermissions') : t('platformMore.access.signInSub')}
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="accent" icon="logout" onClick={() => signInAs('super_admin')}>
                {t('platformMore.access.signInSuper')}
              </Button>
            </div>
          </Panel>
        ) : (
          <>
            {session?.role === 'admin' ? (
              <div className="mb-5">
                <DemoNote>{t('platformMore.access.restrictedNote')}</DemoNote>
              </div>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activeId === 'clients' ? (
                  <ClientsTab onOpenSales={(id) => goTab('sales', id)} />
                ) : null}
                {activeId === 'subscriptions' ? <SubscriptionsTab /> : null}
                {activeId === 'sales' ? <SalesTab focusClientId={focusClientId} /> : null}
                {activeId === 'templates' ? <TemplatesTab /> : null}
                {activeId === 'team' ? <TeamTab /> : null}
                {activeId === 'payments' ? <PaymentsTab /> : null}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <footer className="border-t border-white/8 px-5 py-6 text-center text-[12px] text-ivory/40">
        {t('platformMore.footerNote')}
      </footer>
    </div>
  )
}
