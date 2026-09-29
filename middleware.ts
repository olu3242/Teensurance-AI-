import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const operationalPaths=['/auth/','/api/auth','/admin/waitlist','/api/admin/waitlist'];
const publicPaths=['/waitlist','/api/waitlist','/api/health'];

export function middleware(request:NextRequest){
 const waitlistMode=process.env.NEXT_PUBLIC_WAITLIST_MODE!=='false';
 if(!waitlistMode)return NextResponse.next();

 const {pathname}=request.nextUrl;
 if(pathname==='/'||publicPaths.some(path=>pathname===path||pathname.startsWith(path+'/'))||operationalPaths.some(path=>pathname.startsWith(path))){
   return NextResponse.next();
 }

 if(pathname.startsWith('/api/')){
   return NextResponse.json({error:'Teensurance is currently in waitlist mode.'},{status:423,headers:{'Cache-Control':'no-store'}});
 }

 const target=request.nextUrl.clone();
 target.pathname='/waitlist';
 target.search='';
 target.searchParams.set('locked','1');
 return NextResponse.redirect(target,307);
}

export const config={
 matcher:['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)']
};
