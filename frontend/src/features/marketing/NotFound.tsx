import { Button } from '../../shared/ui/ui.tsx'
import { useI18n } from '../../shared/i18n'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <main className="page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <span className="eyebrow">{t('web.notFound.eyebrow')}</span>
      <h1 className="display-serif mt-4 text-[clamp(38px,6vw,68px)] leading-none">
        {t('web.notFound.title')}
      </h1>
      <p className="mt-4 max-w-md text-umber">{t('web.notFound.sub')}</p>
      <div className="mt-7 flex gap-3">
        <Button to="/" icon="arrowLeft">
          {t('web.notFound.backHome')}
        </Button>
        <Button to="/templates" variant="outline">
          {t('web.notFound.browse')}
        </Button>
      </div>
    </main>
  )
}
