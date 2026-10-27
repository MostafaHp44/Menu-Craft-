import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, Wordmark } from '../components/icons'
import { Button, Card, Img, Input } from '../components/ui'
import { IMG } from '../lib/images'
import { TEMPLATES } from '../lib/templates'
import { cx } from '../lib/utils'

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('marco@bellaitalian.demo')
  const [password, setPassword] = useState('demo-password')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address to continue.')
      return
    }
    if (password.length < 6) {
      setError('Passwords need at least 6 characters.')
      return
    }
    setError('')
    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      navigate('/dashboard')
    }, 650)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* -------------------------------- form --------------------------------- */}
      <div className="flex flex-col bg-ivory px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="MenuCraft home">
            <Wordmark />
          </Link>
          <Link to="/" className="text-[13px] font-medium text-umber transition hover:text-charcoal">
            ← Back home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <span className="eyebrow">Welcome back</span>
          <h1 className="display-serif mt-3 text-[clamp(32px,4vw,44px)] leading-[1.05] text-charcoal">
            Sign in to your
            <br />
            menu workspace.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-umber">
            This prototype has no authentication — the form simply walks you into the demo dashboard.
          </p>

          <Card className="mt-7 p-6">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-espresso">Email</span>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  aria-invalid={Boolean(error) && !/^\S+@\S+\.\S+$/.test(email)}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-espresso">Password</span>
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="text-[12px] font-medium text-umber transition hover:text-flame"
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                </span>
                <span className="relative block">
                  <Input
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-umber">
                    <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
                  </span>
                </span>
              </label>

              {error ? (
                <p className="flex items-center gap-2 rounded-xl border border-rose/40 bg-rose/8 px-3.5 py-2.5 text-[13px] text-rose">
                  <Icon name="alert" size={15} />
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-umber">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#e8571f]" />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('marco@bellaitalian.demo')
                    setPassword('demo-password')
                  }}
                  className="text-[12.5px] font-medium text-flame transition hover:text-flame-dark"
                >
                  Use demo credentials
                </button>
              </div>

              <Button type="submit" size="lg" full loading={busy} icon={busy ? undefined : 'arrowRight'}>
                {busy ? 'Opening workspace…' : 'Continue to dashboard'}
              </Button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-sand" />
              <span className="text-[11.5px] uppercase tracking-[0.16em] text-clay">or</span>
              <span className="h-px flex-1 bg-sand" />
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <Button to="/dashboard" variant="outline" size="sm" icon="home" full>
                Demo dashboard
              </Button>
              <Button to="/admin" variant="outline" size="sm" icon="settings" full>
                Platform admin
              </Button>
            </div>
          </Card>

          <p className="mt-5 text-center text-[13px] text-umber">
            No account needed —{' '}
            <Link to="/templates" className="font-medium text-flame transition hover:text-flame-dark">
              browse the eight templates
            </Link>{' '}
            first.
          </p>
        </div>

        <p className="text-center text-[12px] text-clay">
          Prototype · no credentials are stored or transmitted anywhere.
        </p>
      </div>

      {/* ------------------------------- visual -------------------------------- */}
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <Img
          src={IMG.diningRoomDark}
          alt="Restaurant dining room at night"
          eager
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/60 to-flame/25" />

        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <div className="flex gap-2">
            {TEMPLATES.slice(0, 3).map((template) => (
              <span
                key={template.id}
                className="h-6 w-6 rounded-full border border-white/40"
                style={{ backgroundColor: template.chips[0] }}
                title={template.name}
              />
            ))}
          </div>

          <div>
            <h2 className="display-serif max-w-lg text-[clamp(30px,3.4vw,46px)] leading-[1.06]">
              One workspace for every menu you serve.
            </h2>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ivory/70">
              Three independent restaurant configurations, a full visual editor, print-ready QR codes and
              mock analytics — all running locally in your browser.
            </p>

            <ul className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              {[
                { icon: 'palette', label: 'Design studio' },
                { icon: 'utensils', label: 'Menu CRUD' },
                { icon: 'qr', label: 'QR generator' },
                { icon: 'chart', label: 'Demo analytics' },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/6 px-3.5 py-3 text-[13.5px] backdrop-blur-sm"
                >
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg bg-white/10')}>
                    <Icon name={item.icon} size={16} className="text-flame-light" />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12.5px] text-ivory/45">
            Photography bundled locally · the demo works with no internet connection.
          </p>
        </div>
      </aside>
    </div>
  )
}
