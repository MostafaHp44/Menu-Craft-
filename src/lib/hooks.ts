import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

/**
 * Applies a template's design to the active restaurant (keeping its content)
 * and opens the visual editor — the flow used by every "Customize" button.
 */
export function useCustomize() {
  const beginEdit = useStore((s) => s.beginEdit)
  const navigate = useNavigate()

  return (templateId: string) => {
    beginEdit(templateId)
    navigate('/dashboard/editor')
  }
}

export function publicUrl(slug: string): string {
  return `${slug}.menucraft.com`
}
