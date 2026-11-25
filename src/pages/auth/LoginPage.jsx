import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import { TextField } from '../../components/forms/FormField';
import PasswordField from '../../components/forms/PasswordField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { validateLogin } from '../../utils/validation';
import { DEMO_ACCOUNTS, ROLES } from '../../utils/constants';
import usePageTitle from '../../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const u = await login(form);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      const from = location.state?.from?.pathname;
      const home = u.role === ROLES.ADMIN ? '/admin/dashboard' : '/user/dashboard';
      const allowed = from && (u.role === ROLES.ADMIN ? from.startsWith('/admin') || !from.startsWith('/user') : !from.startsWith('/admin'));
      navigate(allowed ? `${from}${location.state.from.search || ''}` : home, { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.field) setErrors({ [err.field]: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fill = (acc) => {
    setForm({ email: acc.email, password: acc.password });
    setErrors({});
    setFormError('');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your saved recipes, collections and meal plans." image="https://images.unsplash.com/photo-1564638305579-5e395c9b62c7" quote="“The secret ingredient is always the people you cook for.”">
      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {formError}
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField label="Email address" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordField label="Password" autoComplete="current-password" required value={form.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" loading={loading} className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Élan Kitchen? <Link to="/signup" className="font-semibold text-forest hover:underline">Create an account</Link>
      </p>

      <section aria-labelledby="demo-heading" className="mt-8 rounded-card border border-ivory-300 bg-white p-5">
        <h2 id="demo-heading" className="flex items-center gap-2 font-sans text-sm font-semibold">
          <KeyRound className="h-4 w-4 text-gold-dark" aria-hidden="true" /> Demonstration accounts
        </h2>
        <p className="mt-1 text-xs text-muted">For local academic demos only. Click “Use” to fill the form, then log in.</p>
        <ul className="mt-4 space-y-3">
          {[
            { label: 'Administrator', icon: ShieldCheck, acc: DEMO_ACCOUNTS.admin },
            { label: 'Registered user', icon: User, acc: DEMO_ACCOUNTS.user },
          ].map(({ label, icon: Icon, acc }) => (
            <li key={label} className="flex items-center justify-between gap-3 rounded-lg bg-ivory p-3">
              <div className="min-w-0 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-charcoal"><Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}</p>
                <p className="mt-1 truncate font-mono text-muted">{acc.email}</p>
                <p className="font-mono text-muted">{acc.password}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => fill(acc)} aria-label={`Use ${label} demo credentials`}>Use</Button>
            </li>
          ))}
        </ul>
      </section>
    </AuthShell>
  );
}
