import AdBanner from './AdBanner';
import './adRail.css';

// Single tall ad per rail. To get the full column filled, create a 300x600
// ad unit in your ad network dashboard and use that key here.
export default function AdRail({ side = 'left' }) {
  return (
    <aside className={`ad-rail ad-rail-${side}`}>
      <AdBanner slot="sidebar" className="ad-side ad-side-tall" />
    </aside>
  );
}
