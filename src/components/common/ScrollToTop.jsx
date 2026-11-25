import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Scrolls to top on forward navigation; preserves browser scroll on back/forward. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, navType]);
  return null;
}
