import {NextResponse} from 'next/server';
// The former client-selected-role API must never remain a parallel write path.
export function GET(){return NextResponse.json({error:'The demo API is retired. Sign in at /pilot.'},{status:410})}
export function POST(){return GET()}
