import { useMemo } from 'react'
import { usePlatformStore } from '../../shared/store/usePlatform.ts'
import { allTemplates } from './templates.ts'

/**
 * Reactive gallery list — stock templates plus every design the super admin
 * duplicated. Importing this module registers the store provider with
 * `templates.ts`, so `getTemplate(customId)` also resolves afterwards.
 */
export function useTemplateList() {
  const customTemplates = usePlatformStore((s) => s.customTemplates)
  return useMemo(() => allTemplates(), [customTemplates])
}
