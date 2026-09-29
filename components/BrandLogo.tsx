import Link from 'next/link';
import {BrandMark} from './BrandMark';

export function BrandLogo({href,compact=false,inverse=false}:{href?:string;compact?:boolean;inverse?:boolean}) {
  const destination=href??'/';
  return <Link href={destination} className={`brandLogo ${compact?'brandLogoCompact':''} ${inverse?'brandLogoInverse':''}`} aria-label="Teensurance home">
    <BrandMark className="brandLogoMark" />
    {!compact&&<span className="brandLogoType">TEENSURANCE<small>SAFETY BEFORE SPEED</small></span>}
  </Link>;
}
