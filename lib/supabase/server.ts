import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {requireSupabaseConfig} from './config';
export async function createClient(){
 const {url,key}=requireSupabaseConfig();const store=await cookies();
 return createServerClient(url,key,{cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}});
}
