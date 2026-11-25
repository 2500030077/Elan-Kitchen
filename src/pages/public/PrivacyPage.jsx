import { STORAGE_KEYS } from '../../utils/constants';
import usePageTitle from '../../hooks/usePageTitle';

export default function PrivacyPage() {
  usePageTitle('Privacy');
  return (
    <div className="container-site max-w-3xl py-14">
      <p className="eyebrow mb-3">Privacy information</p>
      <h1 className="text-4xl font-semibold sm:text-5xl">How Élan Kitchen handles your data</h1>
      <p className="mt-4 text-sm text-muted">Applies to this academic demonstration build.</p>
      <div className="mt-10 space-y-8 leading-relaxed text-charcoal/90">
        <section>
          <h2 className="text-2xl font-semibold">Where your data lives</h2>
          <p className="mt-3">Élan Kitchen has no server or external database. Everything you create — your account, recipes, reviews, favourites, collections, meal plans and shopping lists — is stored in your own browser’s Local Storage on this device. Nothing is transmitted to us or to third parties.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Passwords</h2>
          <p className="mt-3">Passwords are never stored in plain text. Each password is combined with a random salt and processed with PBKDF2 (SHA-256, 120,000 iterations) via the browser’s Web Crypto API; only the derived hash and salt are saved.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Important security limitation</h2>
          <p className="mt-3">This is <strong>academic demonstration authentication</strong>. Anyone with access to this browser can inspect or modify Local Storage, so client-side checks cannot be trusted the way server-side security can. Do not reuse a real password here.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Storage keys used</h2>
          <ul className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-2">
            {Object.values(STORAGE_KEYS).map((k) => <li key={k} className="rounded bg-ivory-200 px-2 py-1">{k}</li>)}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Images</h2>
          <p className="mt-3">Seed recipe photos are loaded from Unsplash’s image CDN under the Unsplash License. Images you upload are compressed in your browser and stored locally as data URLs.</p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Removing your data</h2>
          <p className="mt-3">Clearing this site’s data in your browser settings removes everything permanently. Administrators can also delete member accounts and associated personal data from the Studio.</p>
        </section>
      </div>
    </div>
  );
}
