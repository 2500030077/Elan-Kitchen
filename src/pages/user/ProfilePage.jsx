import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getPreferences, savePreferences } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { TextField, TextAreaField } from '../../components/forms/FormField';
import PasswordField from '../../components/forms/PasswordField';
import PasswordStrength from '../../components/forms/PasswordStrength';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import usePageTitle from '../../hooks/usePageTitle';
import { compressImage } from '../../utils/image';
import { CUISINES, DIETARY_OPTIONS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

function Panel({ title, description, children }) {
  return (
    <section className="card p-5 sm:p-7">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChipGroup({ legend, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])} className={`chip min-h-[36px] ${on ? 'chip-active' : 'hover:border-forest/40'}`}>
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ProfilePage() {
  usePageTitle('Profile & Settings');
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({ name: user.name, email: user.email, bio: user.bio || '' });
  const [profileErr, setProfileErr] = useState({});
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    const p = getPreferences(user.id);
    return { dietary: p.dietary || [], cuisines: p.cuisines || [] };
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const saveProfile = (e) => {
    e.preventDefault();
    try {
      updateProfile(profile);
      setProfileErr({});
      toast.success('Profile updated');
    } catch (err) {
      setProfileErr(err.errors || {});
      toast.error(err.message);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await compressImage(file, { maxDim: 320, quality: 0.8 });
      updateProfile({ ...profile, name: user.name, email: user.email, avatar: dataUrl });
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  const savePrefs = () => {
    try {
      savePreferences(user.id, prefs);
      toast.success('Preferences saved — recommendations updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      await changePassword(pw);
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErr({});
      toast.success('Password changed');
    } catch (err) {
      setPwErr(err.field ? { [err.field]: err.message } : {});
      if (!err.field) toast.error(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Account" title="Profile & settings" description={`Member since ${formatDate(user.createdAt, { month: 'long', year: 'numeric' })}`} />

      <Panel title="Profile" description="This is how other members see you on your recipes and reviews.">
        <div className="mb-6 flex flex-wrap items-center gap-5">
          <div className="relative">
            <Avatar name={user.name} src={user.avatar} size="xl" />
            {avatarBusy && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-forest" aria-hidden="true" /></span>}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onAvatar} />
            <label htmlFor="avatar-file" className="btn btn-secondary cursor-pointer"><Camera className="h-4 w-4" aria-hidden="true" /> {user.avatar ? 'Change picture' : 'Upload picture'}</label>
            {user.avatar && <Button variant="ghost" icon={Trash2} className="text-danger" onClick={() => setRemoveAvatar(true)}>Remove</Button>}
          </div>
          <p className="w-full text-xs text-muted">JPG, PNG or WebP up to 5 MB. Images are cropped and compressed locally.</p>
        </div>
        <form onSubmit={saveProfile} noValidate className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full name" required value={profile.name} maxLength={60} onChange={(e) => setProfile({ ...profile, name: e.target.value })} error={profileErr.name} autoComplete="name" />
          <TextField label="Email address" type="email" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} error={profileErr.email} autoComplete="email" />
          <TextAreaField className="sm:col-span-2" label="Short bio" rows={3} maxLength={240} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} error={profileErr.bio} hint={`${profile.bio.length}/240`} />
          <div className="sm:col-span-2"><Button type="submit">Save profile</Button></div>
        </form>
      </Panel>

      <Panel title="Food preferences" description="Used to personalise the recommendations on your dashboard.">
        <div className="space-y-5">
          <ChipGroup legend="Dietary preferences" options={DIETARY_OPTIONS} value={prefs.dietary} onChange={(v) => setPrefs({ ...prefs, dietary: v })} />
          <ChipGroup legend="Preferred cuisines" options={CUISINES} value={prefs.cuisines} onChange={(v) => setPrefs({ ...prefs, cuisines: v })} />
          <Button onClick={savePrefs}>Save preferences</Button>
        </div>
      </Panel>

      <Panel title="Change password" description="You’ll need your current password to set a new one.">
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <PasswordField label="Current password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} />
          <div>
            <PasswordField label="New password" autoComplete="new-password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErr.newPassword} />
            {pw.newPassword && <PasswordStrength password={pw.newPassword} />}
          </div>
          <PasswordField label="Confirm new password" autoComplete="new-password" required value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} error={pwErr.confirmPassword} />
          <Button type="submit" loading={pwBusy}>Update password</Button>
        </form>
      </Panel>

      <Panel title="Session">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Signed in as <strong className="text-charcoal">{user.email}</strong></p>
          <Button variant="secondary" icon={LogOut} className="text-danger" onClick={() => { logout(); toast.success('You have been signed out.'); navigate('/'); }}>Log out</Button>
        </div>
      </Panel>

      <ConfirmDialog
        open={removeAvatar}
        onClose={() => setRemoveAvatar(false)}
        onConfirm={() => {
          updateProfile({ ...profile, name: user.name, email: user.email, avatar: '' });
          setRemoveAvatar(false);
          toast.success('Profile picture removed');
        }}
        title="Remove profile picture?"
        message="Your initials will be shown instead."
        confirmLabel="Remove"
      />
    </div>
  );
}
