import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/ui/icons.tsx'
import { Button, Card, Field, Input } from '../../shared/ui/ui.tsx'
import { useBackendAuth } from '../../shared/store/useBackendAuth.ts'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setError(''); setSuccess(false)
    try {
      const user = await useBackendAuth.getState().signin(email.trim(), password)
      if (user.role !== 'super_admin') {
        await useBackendAuth.getState().logout()
        setError('Access denied: only super_admin can manage the platform.')
        setBusy(false); return
      }
      setSuccess(true)
      setTimeout(() => navigate('/admin'), 600)
    } catch {
      setError('Invalid email or password.')
    } finally { setBusy(false) }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0c14] px-5 py-12">
      {/* Premium gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f111a] via-[#13142b] to-[#0b0c14]" />
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-flame/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="relative overflow-hidden border border-white/10 bg-[#14162f]/90 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Accent top line */}
          <div className="h-1 w-full bg-gradient-to-r from-flame via-violet-500 to-flame" />

          <div className="p-8 sm:p-10 bg-[#000]/90 backdrop-blur-xl">
            {/* Logo / Brand */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-flame to-violet-600 shadow-lg shadow-flame/20">
                <Icon name="shield" size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight text-ivory">Digital Menu</h2>
                <p className="text-[11px] font-medium tracking-wide text-ivory/50 uppercase">Super Admin</p>
              </div>
            </div>

            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ivory">Platform Console</h1>
            <p className="mb-8 text-sm text-ivory/50">Sign in to manage restaurants, plans, subscriptions, and financial reports.</p>

            <form onSubmit={submit} className="space-y-4" autoComplete="off">
              <Field label="Email address" className="w-full text-black">
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="super@menudigital.demo"
                  autoComplete="username"
                />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-2.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-ivory/60 hover:text-ivory hover:bg-white/10 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>

              {error ? <div className="rounded-lg bg-rose/10 border border-rose/20 px-3.5 py-2.5 text-sm text-rose">{error}</div> : null}
              {success ? <div className="rounded-lg bg-moss/10 border border-moss/20 px-3.5 py-2.5 text-sm text-moss">Authentication verified. Redirecting…</div> : null}

              <Button type="submit" variant="accent" loading={busy} disabled={busy || !email || !password} full>
                {busy ? 'Signing in…' : 'Sign in to Console'}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-[11px] text-ivory/30">
              <Icon name="lock" size={12} />
              <span>Only users with <strong className="text-ivory/70">super_admin</strong> role are authorized.</span>
                   <NavLink to={'/'}> 
                   <Button className="ml-auto text-[11px] text-ivory/30 hover:text-ivory/70 w-[10em] bg-[white/10]"   size="sm">
               Back To Home
              </Button>
</NavLink>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-ivory/30">Digital Menu — Platform Administration</p>
      </div>
    </div>
  )
}
