import { useState } from 'react';
import { FALLBACK_IMAGE } from '../../utils/constants';
import { imageUrl } from '../../utils/helpers';

/** Lazy-loaded image with shimmer placeholder and graceful fallback. */
export default function RecipeImage({ src, alt, width = 800, className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const resolved = failed || !src ? FALLBACK_IMAGE : imageUrl(src, width);
  return (
    <div className={`relative overflow-hidden bg-ivory-200 ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
      <img
        src={resolved}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
          setLoaded(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </div>
  );
}
