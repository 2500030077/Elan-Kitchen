import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import { TextField, CheckboxField } from '../../components/forms/FormField';
import PasswordField from '../../components/forms/PasswordField';
import PasswordStrength from '../../components/forms/PasswordStrength';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { validateSignup } from '../../utils/validation';
import { findUserByEmail } from '../../services/authService';
import usePageTitle from '../../hooks/usePageTitle';

export default function SignupPage() {
  usePageTitle('Create account');
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const fieldErrors = (f) => {
    const errs = validateSignup(f);
    if (!errs.email && f.email && findUserByEmail(f.email)) errs.email = 'An account with this email already exists.';
    return errs;
  };

  const set = (k) => (e) => {
    const value = k === 'acceptTerms' ? e.target.checked : e.target.value;
    const next = { ...form, [k]: value };
    setForm(next);
    setFormError('');
    if (touched[k] || errors[k]) {
      const errs = fieldErrors(next);
      setErrors((er) => ({ ...er, [k]: errs[k], ...(k === 'password' && touched.confirmPassword ? { confirmPassword: errs.confirmPassword } : {}) }));
    }
  };

  const blur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors((er) => ({ ...er, [k]: fieldErrors(form)[k] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = fieldErrors(form);
    setErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true, acceptTerms: true });
    if (Object.keys(errs).length) {
      document.getElementById(`signup-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setLoading(true);
    try {
      const u = await signup(form);
      toast.success(`Welcome to Élan Kitchen, ${u.name.split(' ')[0]}!`);
      navigate('/user/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      if (err.field) setErrors({ [err.field]: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Join the community" subtitle="Save recipes, plan your week and share your signature dishes." image="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" quote="“Every great cook started with one recipe they couldn’t stop making.”">
      {formError && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50 p-3.5 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {formError}
        </div>
      )}
      <form onSubmit={submit} noValidate className="space-y-5">
        <TextField id="signup-name" label="Full name" autoComplete="name" required value={form.name} onChange={set('name')} onBlur={blur('name')} error={errors.name} maxLength={60} />
        <TextField id="signup-email" label="Email address" type="email" autoComplete="email" required value={form.email} onChange={set('email')} onBlur={blur('email')} error={errors.email} />
        <div>
          <PasswordField id="signup-password" label="Password" autoComplete="new-password" required value={form.password} onChange={set('password')} onBlur={blur('password')} error={errors.password} />
          <PasswordStrength password={form.password} />
        </div>
        <PasswordField id="signup-confirmPassword" label="Confirm password" autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} onBlur={blur('confirmPassword')} error={errors.confirmPassword} />
        <CheckboxField id="signup-acceptTerms" checked={form.acceptTerms} onChange={set('acceptTerms')} error={errors.acceptTerms}>
          I agree to the community guidelines and understand this is a demonstration app that stores data in my browser (see <Link to="/privacy" className="font-medium text-forest underline">privacy information</Link>).
        </CheckboxField>
        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already a member? <Link to="/login" className="font-semibold text-forest hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
