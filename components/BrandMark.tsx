export function BrandMark({className='',size='default'}:{className?:string;size?:'default'|'large'}) {
  return <span
    className={`brandMarkCanonical ${size==='large'?'brandMarkLarge':''} ${className}`.trim()}
    data-teensurance-brand-mark=""
    aria-hidden="true"
  />;
}
