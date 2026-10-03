export type Row=Record<string,unknown>;
export interface Statement {run(...args:unknown[]):Promise<unknown>;get(...args:unknown[]):Promise<Row|undefined>;all(...args:unknown[]):Promise<Row[]>}
export interface Database {dialect:'sqlite'|'postgres';exec(sql:string):Promise<void>;prepare(sql:string):Statement;close():Promise<void>}
