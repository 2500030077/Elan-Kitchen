import { useState } from 'react';
import { Mail, MapPin, Info, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextField, TextAreaField, SelectField } from '../../components/forms/FormField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { saveContactMessage } from '../../services/userService';
import { validateContact } from '../../utils/validation';
import usePageTitle from '../../hooks/usePageTitle';

export default function ContactPage() {
  usePageTitle('Contact Us');
  const { user } = useAuth();
  const empty = { name: user?.name || '', email: user?.email || '', subject: '', message: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validateContact(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    try {
      saveContactMessage(form, user?.id || null);
      setSent(true);
      setForm(empty);
      toast.success('Message saved locally');
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    }
  };

  return (
    <div className="container-site grid gap-12 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="eyebrow mb-3">Contact</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">We’d love to hear from you</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">Questions about a recipe, feedback on the platform, or partnership ideas — drop us a note.</p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-forest" aria-hidden="true" /> hello@elankitchen.example</li>
          <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-forest" aria-hidden="true" /> Academic demonstration project</li>
        </ul>
        <div className="mt-8 flex gap-3 rounded-card border border-gold-light bg-gold-light/30 p-4 text-sm leading-relaxed" role="note">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
          <p><strong>Demonstration notice:</strong> messages are saved only in this browser’s Local Storage (<code>elan_contact_messages</code>). They are <strong>not</strong> emailed or delivered to any external service.</p>
        </div>
      </div>
      <div className="card p-6 sm:p-8">
        {sent && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800" role="status">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Thank you! Your message has been saved locally for demonstration purposes.</p>
          </div>
        )}
        <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
          <TextField label="Your name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
          <TextField label="Email address" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          <SelectField className="sm:col-span-2" label="Subject" required value={form.subject} onChange={set('subject')} error={errors.subject} placeholder="Choose a topic" options={['Recipe question', 'Feedback', 'Report a problem', 'Partnership', 'Other']} />
          <TextAreaField className="sm:col-span-2" label="Message" required rows={6} value={form.message} onChange={set('message')} error={errors.message} maxLength={2000} />
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full sm:w-auto">Send message</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
