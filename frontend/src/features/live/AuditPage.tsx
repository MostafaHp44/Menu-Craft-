import { useState } from 'react'
import { Button, Card, Field, Input, Select } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'
import { ownerApi, type AuditResponse } from '../../shared/api/client.ts'
import { useAsync } from './useAsync.ts'
import { ErrorBlock, LoadingBlock, PageHeader, RefreshButton, TableWrap, Td, Th } from './components.tsx'
import { daysAgoISO, formatDateTime, todayISO } from './format.ts'

const LIMIT = 25

export default function AuditPage() {
  const { t, lang } = useI18n()
  const [category, setCategory] = useState('')
  const [from, setFrom] = useState(daysAgoISO(6))
  const [to, setTo] = useState(todayISO())
  const [offset, setOffset] = useState(0)

  const audit = useAsync<AuditResponse>(
    () =>
      ownerApi.audit({
        category: category || undefined,
        ...(from && to ? { from, to } : {}),
        limit: LIMIT,
        offset,
      }),
    [category, from, to, offset]
  )

  const data = audit.data
  const page = Math.floor(offset / LIMIT) + 1
  const canPrev = offset > 0
  const canNext = data ? offset + LIMIT < data.total : false

  return (
    <div>
      <PageHeader
        title={t('live.audit.title')}
        sub={t('live.audit.sub')}
        actions={<RefreshButton onClick={audit.refresh} loading={audit.loading} />}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t('live.audit.category')}>
            <Select
              value={category}
              onChange={(event) => {
                setOffset(0)
                setCategory(event.target.value)
              }}
            >
              <option value="">{t('live.common.all')}</option>
              <option value="orders">{t('live.audit.orders')}</option>
              <option value="employees">{t('live.audit.employees')}</option>
            </Select>
          </Field>
          <Field label={t('live.common.from')}>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(event) => {
                setOffset(0)
                setFrom(event.target.value)
              }}
            />
          </Field>
          <Field label={t('live.common.to')}>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setOffset(0)
                setTo(event.target.value)
              }}
            />
          </Field>
        </div>
      </Card>

      {audit.error ? <ErrorBlock message={audit.error} onRetry={audit.refresh} /> : null}
      {audit.loading && !data ? <LoadingBlock rows={6} /> : null}

      {data && data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone bg-cream/40 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-charcoal">{t('live.audit.empty')}</p>
        </div>
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('live.audit.action')}</Th>
                <Th>{t('live.audit.actor')}</Th>
                <Th>{t('live.common.branch')}</Th>
                <Th>{t('live.audit.when')}</Th>
                <Th>{t('live.audit.details')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-cream/40">
                  <Td className="font-mono text-[12px] font-medium text-charcoal">{item.action}</Td>
                  <Td>
                    <span className="block">{item.actor_name ?? '—'}</span>
                    <span className="text-[11.5px] text-clay">{item.actor_role ?? '—'}</span>
                  </Td>
                  <Td className="font-mono text-[11.5px] text-umber">{item.branch_id ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-[12px] text-umber">{formatDateTime(item.created_at, lang)}</Td>
                  <Td>
                    <details>
                      <summary className="cursor-pointer text-[12px] text-flame">{t('live.audit.details')}</summary>
                      <pre className="mt-1 max-w-[320px] overflow-x-auto rounded-lg bg-cream/70 p-2 text-[10.5px] leading-relaxed text-espresso">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    </details>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[12px] text-umber">
              {t('live.audit.page')} {page} · {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              >
                {t('live.audit.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setOffset(offset + LIMIT)}
              >
                {t('live.audit.next')}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
