import { useEffect, useState, type ReactNode } from 'react'
import { Button, Input, Modal } from '../ui/ui.tsx'

/**
 * نظام الـ popups الداخلي بديلًا عن نوافذ المتصفح (alert/confirm/prompt).
 *
 * الاستخدام (بديل مباشر لـ window.confirm):
 *
 *   if (!(await confirmDialog({ title: '…', message: '…' }))) return
 *
 *   await alertDialog({ title: '…', message: '…' })          // بدل window.alert
 *   const v = await formDialog({ title: '…', fields: [...] }) // بدل window.prompt
 *   if (!v) return                                            // أُلغي/أُغلق
 *
 * المكوّن <DialogHost /> يُركَّب مرة واحدة في جذر التطبيق.
 */

type ConfirmReq = {
  kind: 'confirm'
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'accent'
  resolve: (ok: boolean) => void
}

type AlertReq = {
  kind: 'alert'
  title: string
  message?: string
  okLabel?: string
  resolve: () => void
}

export type DialogField = {
  key: string
  label: string
  placeholder?: string
  initialValue?: string
  help?: string
}

type FormReq = {
  kind: 'form'
  title: string
  message?: string
  fields: DialogField[]
  confirmLabel?: string
  resolve: (values: Record<string, string> | null) => void
}

export type DialogRequest = ConfirmReq | AlertReq | FormReq

let current: DialogRequest | null = null
const listeners = new Set<(req: DialogRequest | null) => void>()

function emit() {
  for (const l of listeners) l(current)
}

function open(req: DialogRequest) {
  current = req
  emit()
}

/** إغلاق الباب الحالية بالنتيجة ثم إشعار المُستمعين */
function settle(result: boolean | Record<string, string> | null | void) {
  const req = current
  current = null
  emit()
  if (!req) return
  if (req.kind === 'confirm') req.resolve(Boolean(result))
  else if (req.kind === 'alert') req.resolve()
  else req.resolve((result as Record<string, string> | null) ?? null)
}

export function confirmDialog(opts: Omit<ConfirmReq, 'kind' | 'resolve'>): Promise<boolean> {
  return new Promise<boolean>((resolve) => open({ kind: 'confirm', ...opts, resolve }))
}

export function alertDialog(opts: Omit<AlertReq, 'kind' | 'resolve'>): Promise<void> {
  return new Promise<void>((resolve) => open({ kind: 'alert', ...opts, resolve }))
}

export function formDialog(
  opts: Omit<FormReq, 'kind' | 'resolve'>
): Promise<Record<string, string> | null> {
  return new Promise<Record<string, string> | null>((resolve) =>
    open({ kind: 'form', ...opts, resolve })
  )
}

/* --------------------------------- host ---------------------------------- */

export function DialogHost() {
  const [req, setReq] = useState<DialogRequest | null>(current)

  useEffect(() => {
    listeners.add(setReq)
    setReq(current)
    return () => {
      listeners.delete(setReq)
    }
  }, [])

  if (!req) return null

  if (req.kind === 'confirm') {
    return (
      <Modal
        open
        onClose={() => settle(false)}
        title={req.title}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => settle(false)}>
              {req.cancelLabel ?? 'Cancel'}
            </Button>
            <Button variant={req.tone === 'accent' ? 'accent' : 'danger'} onClick={() => settle(true)}>
              {req.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        {req.message ? (
          <p className="text-[14px] leading-relaxed text-umber">{req.message}</p>
        ) : null}
      </Modal>
    )
  }

  if (req.kind === 'alert') {
    return (
      <Modal
        open
        onClose={() => settle()}
        title={req.title}
        size="sm"
        footer={
          <Button variant="dark" onClick={() => settle()}>
            {req.okLabel ?? 'OK'}
          </Button>
        }
      >
        {req.message ? (
          <p className="text-[14px] leading-relaxed text-umber">{req.message}</p>
        ) : null}
      </Modal>
    )
  }

  return <FormDialogBody req={req} />
}

function FormDialogBody({ req }: { req: FormReq }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(req.fields.map((f) => [f.key, f.initialValue ?? '']))
  )

  const canSubmit = req.fields.every((f) => (values[f.key] ?? '').trim().length > 0)

  return (
    <Modal
      open
      onClose={() => settle(null)}
      title={req.title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => settle(null)}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={!canSubmit}
            onClick={() => {
              const trimmed = Object.fromEntries(
                Object.entries(values).map(([k, v]) => [k, v.trim()])
              )
              settle(trimmed)
            }}
          >
            {req.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    >
      {req.message ? (
        <p className="mb-3 text-[14px] leading-relaxed text-umber">{req.message}</p>
      ) : null}
      <div className="space-y-3">
        {req.fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[12.5px] font-medium text-espresso">{f.label}</span>
            <Input
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
            {f.help ? <span className="mt-1 block text-[11.5px] text-umber/70">{f.help}</span> : null}
          </label>
        ))}
      </div>
    </Modal>
  )
}

/* re-export للاستخدامات التي تحتاج نوع الحقول فقط */
export type { ReactNode }
