import { useEffect, useMemo } from 'react'
import { usePlatformStore } from '../../shared/store/usePlatform.ts'
import { allTemplates } from './templates.ts'

/**
 * Reactive gallery list — stock templates plus every design the super admin
 * duplicated. Importing this module registers the store provider with
 * `templates.ts`, so `getTemplate(customId)` also resolves afterwards.
 * Overrides (images / hero / videos) are merged on top of each stock template.
 */
export function useTemplateList() {
  const customTemplates = usePlatformStore((s) => s.customTemplates)
  const templateOverrides = usePlatformStore((s) => s.templateOverrides)
  const refreshOverrides = usePlatformStore((s) => s.refreshOverrides)
  useEffect(() => {
    void refreshOverrides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return useMemo(() => allTemplates(), [customTemplates, templateOverrides])
}
