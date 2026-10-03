import {Pool,type PoolClient} from 'pg';
import type {Database} from './types';
export function postgresSql(sql:string){let n=0;return sql.replace(/json_extract\(payload,'\$\.(\w+)'\)/g,"(payload::jsonb->>'$1')").replace(/INSERT INTO records VALUES/g,'INSERT INTO records(id,kind,household_id,owner_id,payload) VALUES').replace(/\browid\b/g,'sequence').replace(/\?/g,()=>`$${++n}`)}
export function postgres(url:string,role:'teensurance_runtime'|null='teensurance_runtime'){
 const pool=new Pool({connectionString:url,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:10000,options:'-c search_path=teensurance -c statement_timeout=15000'});
 function connection(client:PoolClient|Pool):Database{const query=async(sql:string,args:unknown[]=[])=>client.query(postgresSql(sql),args);return {dialect:'postgres',exec:async sql=>{await query(sql)},prepare(sql){return {run:async(...args)=>{await query(sql,args)},get:async(...args)=>(await query(sql,args)).rows[0],all:async(...args)=>(await query(sql,args)).rows}},close:async()=>{if(client===pool)await pool.end()}}}
 return {database:connection(pool),acquire:async()=>{const client=await pool.connect();try{if(role)await client.query('SET ROLE teensurance_runtime')}catch(error){client.release();throw error}return {database:connection(client),release:()=>client.release()}}};
}
