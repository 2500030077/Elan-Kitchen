import { getInitials } from '../../utils/helpers';

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl' };
  if (src) {
    return <img src={src} alt={`${name || 'User'} avatar`} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`} />;
  }
  return (
    <span aria-hidden="true" className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-forest-100 font-semibold text-forest-dark ring-2 ring-white ${className}`}>
      {getInitials(name)}
    </span>
  );
}
