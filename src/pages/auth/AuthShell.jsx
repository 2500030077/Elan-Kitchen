import RecipeImage from '../../components/common/RecipeImage';

export default function AuthShell({ title, subtitle, children, image, quote }) {
  return (
    <div className="container-site grid min-h-[calc(100vh-72px)] items-stretch gap-10 py-8 lg:grid-cols-2 lg:py-12">
      <div className="flex flex-col justify-center">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-4xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden rounded-[20px] lg:block">
        <RecipeImage src={image} alt="" width={1000} eager className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" aria-hidden="true" />
        <figure className="absolute inset-x-0 bottom-0 p-10 text-ivory">
          <blockquote className="font-display text-3xl font-medium italic leading-snug">{quote}</blockquote>
          <figcaption className="mt-3 text-sm uppercase tracking-[0.18em] text-gold">Discover. Create. Savor.</figcaption>
        </figure>
      </div>
    </div>
  );
}
