import { useCallback, useEffect, useState } from 'react'
import { templatesAPI, ApiError } from '../../shared/api/service'
import { useBackendRestaurantId } from '../../shared/store/useBackendAuth'
import { useStore } from '../../shared/store/useStore'

export interface SelectedTemplate {
  templateId: string
  selectedAt: string
}

/**
 * التمبليتات المختارة من صاحب المطعم ("قوالبي") — تُقرأ وتُكتب في قاعدة
 * البيانات عبر /api/restaurants/:id/templates.
 *
 * نفس معرّف الموقع المستخدم في "Use template" (الموقع النشط في التبويب أولاً
 * ثم معرّف جلسة الـ JWT)، وإن فشل الطلب يُعاد المحاولة بالمعرّف الآخر حتى
 * تظهر القائمة مهما كان معرّف الموقع المحفوظ في الجلسة.
 */
export function useSelectedTemplates() {
  const activeLocalId = useStore((s) => s.activeId)
  const sessionId = useBackendRestaurantId()
  const primaryId = activeLocalId || sessionId || ''
  const fallbackId = sessionId && sessionId !== primaryId ? sessionId : ''

  const [items, setItems] = useState<SelectedTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!primaryId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await templatesAPI.list(primaryId)
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      // موقع غير مملوك لهذا الحساب (أو بلا جلسة) — نجرب معرّف الجلسة قبل الاستسلام
      if (fallbackId && err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
        try {
          const res = await templatesAPI.list(fallbackId)
          setItems(Array.isArray(res.data) ? res.data : [])
          return
        } catch {
          /* fallthrough */
        }
      }
      // بدون جلسة/صلاحية — القائمة تبقى فارغة بدل أن تُفشل الصفحة
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [primaryId, fallbackId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** إزالة تمبليت من القائمة (تأكيد من المستخدم قبل الاستدعاء) */
  const remove = useCallback(
    async (templateId: string) => {
      const previous = items
      setItems((prev) => prev.filter((i) => i.templateId !== templateId))
      if (!primaryId) return
      try {
        await templatesAPI.remove(primaryId, templateId)
      } catch {
        setItems(previous) // رجوع للحالة السابقة إن فشل الحذف
      }
    },
    [items, primaryId]
  )

  const has = useCallback(
    (templateId: string) => items.some((i) => i.templateId === templateId),
    [items]
  )

  return { items, loading, refresh, remove, has, restaurantId: primaryId }
}
