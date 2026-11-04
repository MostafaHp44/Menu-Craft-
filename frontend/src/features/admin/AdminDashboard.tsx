import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/ui/ui.tsx';
import { useAuthStore } from '../../shared/store/useAuth';
export default function AdminDashboard() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const handleLogin = (e: any) => { e.preventDefault(); const r = signIn(email); if (!r.ok) setError('Login failed'); else setError(''); };
  return (
    <div className="min-h-screen bg-ivory p-8">
      <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>
      <Card className="max-w-md p-6 mx-auto">
        <h2 className="text-lg font-semibold mb-4">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="flex gap-2">
            <Input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button type="button" size="sm" onClick={() => setShowPass(p => !p)}>{showPass ? 'Hide' : 'Show'}</Button>
          </div>
          <Button type="submit" variant="accent">Login</Button>
          {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        </form>
      </Card>
      <div className="grid md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
        <Link to="/admin/subscription-requests"><Card className="p-4 font-semibold">Subscription Requests</Card></Link>
        <Link to="/admin/revenue"><Card className="p-4 font-semibold">Revenue & Profit</Card></Link>
        <Link to="/dashboard/design"><Card className="p-4 font-semibold">Dashboard Theme</Card></Link>
      </div>
    </div>
  );
}
