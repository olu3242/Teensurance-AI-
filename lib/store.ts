import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {initialState, normalizeState, type State} from './domain';
const filename = () => join(process.cwd(),'data','pilot.json');
let queue:Promise<unknown> = Promise.resolve();
export async function readState():Promise<State> {
  try {return normalizeState(JSON.parse(await readFile(filename(),'utf8')) as Partial<State>);}
  catch (e) {if ((e as NodeJS.ErrnoException).code==='ENOENT') return initialState(); throw e;}
}
export function updateState<T>(change:(state:State)=>T|Promise<T>):Promise<T> {
  const work = queue.then(async()=>{
    const state = await readState();
    const result = await change(state);
    await mkdir(join(process.cwd(),'data'),{recursive:true});
    const target = filename();
    const temp = `${target}.${process.pid}.tmp`;
    await writeFile(temp,JSON.stringify(state,null,2));
    await rename(temp,target);
    return result;
  });
  queue = work.catch(()=>{});
  return work;
}
