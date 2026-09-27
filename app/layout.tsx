import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Teensurance — driving journey',description:'A safer way for families to plan and record supervised driving practice.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
