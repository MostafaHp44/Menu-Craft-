import { Button } from '../components/ui'

export default function NotFound() {
  return (
    <main className="page flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <span className="eyebrow">Error 404</span>
      <h1 className="display-serif mt-4 text-[clamp(38px,6vw,68px)] leading-none">
        This table isn’t set.
      </h1>
      <p className="mt-4 max-w-md text-umber">
        The page you were looking for has been moved, renamed or never existed in this demo.
      </p>
      <div className="mt-7 flex gap-3">
        <Button to="/" icon="arrowLeft">
          Back home
        </Button>
        <Button to="/templates" variant="outline">
          Browse templates
        </Button>
      </div>
    </main>
  )
}
