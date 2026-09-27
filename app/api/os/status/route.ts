import {NextResponse} from 'next/server';
import {agentRegistry,buildContext,triggerRegistry,workflowRegistry} from '@/lib/os';
import {readState} from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 const state=await readState();
 return NextResponse.json({
  architecture:{name:'Teensurance Workflow OS',version:'1.0.0-mvp',principle:'GUARD mediates every state-changing command; agents never mutate state directly.'},
  context:buildContext(state),
  registries:{
   workflows:workflowRegistry.map(w=>({id:w.id,version:w.version,owner:w.owner,allowedActions:w.allowedActions})),
   triggers:triggerRegistry.map(t=>({id:t.id,priority:t.priority,source:t.source,workflow:t.workflow,agent:t.agent})),
   agents:agentRegistry
  }
 },{headers:{'Cache-Control':'no-store'}});
}
