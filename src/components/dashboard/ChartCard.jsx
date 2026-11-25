export default function ChartCard({ title, description, children, className = '', empty }) {
  return (
    <section className={`card p-5 ${className}`} aria-label={title}>
      <h2 className="font-sans text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4">{empty ? <p className="flex h-56 items-center justify-center text-sm text-muted">{empty}</p> : children}</div>
    </section>
  );
}
