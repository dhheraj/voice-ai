import { useEffect, useRef, useState } from 'react';
import { AD_CONFIG } from '../adsConfig';

const FALLBACK_HEIGHT = 100;

export default function AdBanner({ slot = 'header', className = '' }) {
  const containerRef = useRef(null);
  const [state, setState] = useState('idle');

  useEffect(() => {
    const config = AD_CONFIG.banners?.[slot];
    if (!config?.enabled) return;

    const container = containerRef.current;
    if (!container) return;

    setState('loading');

    const uniqueId = `ad-${slot}-${Math.random().toString(36).slice(2, 9)}`;
    const adDiv = document.createElement('div');
    adDiv.id = uniqueId;
    container.appendChild(adDiv);

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      var atOptions = {
        'key' : '${config.key}',
        'format' : 'iframe',
        'height' : ${config.height},
        'width' : ${config.width},
        'params' : {}
      };
    `;
    container.appendChild(optionsScript);

    const adScript = document.createElement('script');
    adScript.type = 'text/javascript';
    adScript.src = `https://www.highperformanceformat.com/${config.key}/invoke.js`;
    adScript.async = true;
    adScript.setAttribute('data-cfasync', 'false');
    adScript.onload = () => setState('loaded');
    adScript.onerror = () => setState('error');
    container.appendChild(adScript);

    const timer = setTimeout(() => {
      if (state === 'loading') setState('error');
    }, 6000);

    return () => {
      clearTimeout(timer);
      if (container.contains(adDiv)) container.removeChild(adDiv);
    };
  }, [slot]);

  const config = AD_CONFIG.banners?.[slot];
  if (!config?.enabled) return null;

  return (
    <div className={`ad-slot ad-slot-${slot} ${className}`.trim()}>
      <div
        ref={containerRef}
        className="ad-slot-inner"
        style={{ minHeight: state === 'idle' || state === 'loading' ? `${FALLBACK_HEIGHT}px` : '0' }}
      />
    </div>
  );
}
