import { useBackendAuth } from '../store/useBackendAuth';

export default function AdminRequire() {
  const user = useBackendAuth(s => s.user);
  return !user || (user.role !== 'admin' && user.role !== 'super_admin') ? null : <div>ok</div>;
}
