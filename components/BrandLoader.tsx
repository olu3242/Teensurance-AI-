import {BrandMark} from './BrandMark';

export function BrandLoader({label='Loading Teensurance'}:{label?:string}) {
  return <div className="brandLoader" role="status" aria-live="polite">
    <BrandMark className="brandLoaderMark" size="large" />
    <span className="brandLoaderPulse" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
