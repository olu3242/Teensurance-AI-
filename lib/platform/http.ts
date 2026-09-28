import {NextResponse} from 'next/server';
import {AppError,authenticate} from './auth';
export const cookieName='teensurance_session';
export function tokenFrom(request:Request){return request.headers.get('cookie')?.split(';').map(p=>p.trim()).find(p=>p.startsWith(`${cookieName}=`))?.slice(cookieName.length+1)}
export function requestUser(request:Request){return authenticate(tokenFrom(request))}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');const requestUrl=new URL(request.url);const expectedHost=request.headers.get('host')||requestUrl.host;let valid=false;try{const source=new URL(origin||'');valid=source.host===expectedHost&&source.protocol===requestUrl.protocol}catch{/* Reject absent or malformed origins. */}if(!valid)throw new AppError('Same-origin request required.',403);if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AppError('JSON content type required.',415)}
export async function body(request:Request){const text=await request.text();if(Buffer.byteLength(text)>16384)throw new AppError('Request too large.',413);try{return JSON.parse(text) as unknown}catch{throw new AppError('Invalid JSON.',400)}}
export function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function errorResponse(error:unknown){if(error instanceof AppError)return json({error:error.message},error.status);console.error('Platform request failed',error instanceof Error?error.message:'Unknown error');return json({error:'Unable to complete this request.'},500)}
