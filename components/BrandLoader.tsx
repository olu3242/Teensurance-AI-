export function BrandLoader({label='Loading Teensurance'}:{label?:string}) {
  return <div className="brandLoader" role="status" aria-live="polite">
    <span className="brandLoaderMark" aria-hidden="true" />
    <span className="brandLoaderPulse" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
