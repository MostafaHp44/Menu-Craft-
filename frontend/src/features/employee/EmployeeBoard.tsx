import { useI18n, type TKey } from '../../shared/i18n'

export default function EmployeeBoard() {
  const { t } = useI18n()
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold text-[#0a192f] dark:text-white">{t('employee.dashboardTitle')}</h1>
      <p className="max-w-lg text-center text-[#334155] dark:text-[#94a3b8]">{t('employee.dashboardDesc')}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['owner', 'cashier', 'kitchen', 'waiter', 'customStaff'].map((key) => (
          <div key={key} className="rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] bg-white dark:bg-[#0f172a] p-6 shadow-sm hover:shadow-md transition">
            <h3 className="font-semibold text-[#0a192f] dark:text-white mb-2">{t(`employee.role.${key}` as TKey) || key}</h3>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{t('employee.roleAccessOnly')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
