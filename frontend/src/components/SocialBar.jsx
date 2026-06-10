import { useEffect } from 'react';
import { AD_CONFIG } from '../config/adsConfig';

// Social Bar — sticky notification-style ad. Loads once per session.
export default function SocialBar() {
  useEffect(() => {
    if (!AD_CONFIG.socialBar?.enabled) return;
    if (sessionStorage.getItem('socialbar-loaded')) return;

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = AD_CONFIG.socialBar.script;
    document.body.appendChild(script);

    sessionStorage.setItem('socialbar-loaded', '1');

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  if (!AD_CONFIG.socialBar?.enabled) return null;
  return null;
}
