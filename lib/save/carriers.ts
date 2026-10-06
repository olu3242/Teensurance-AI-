import type {QuoteOption,QuoteProvider,QuoteRequest} from './quotes';

export type CarrierAdapterConfig={
 id:string;
 endpoint:string;
 apiKeyEnv:string;
 timeoutMs?:number;
};

export class HttpCarrierAdapter implements QuoteProvider{
 constructor(private readonly config:CarrierAdapterConfig){}
 get id(){return this.config.id}
 async quote(request:QuoteRequest):Promise<QuoteOption[]>{
  const key=process.env[this.config.apiKeyEnv];
  if(!key)throw new Error('Carrier adapter is not configured.');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),this.config.timeoutMs||10000);
  try{
   const response=await fetch(this.config.endpoint,{
    method:'POST',
    headers:{authorization:'Bearer '+key,'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify(request),
    signal:controller.signal
   });
   if(!response.ok)throw new Error('Carrier adapter rejected the request.');
   const body=await response.json() as {quotes?:QuoteOption[]};
   return (body.quotes||[]).map(q=>({...q,provider:q.provider||this.config.id}));
  }finally{clearTimeout(timer)}
 }
}

export function configuredCarrierAdapters(configs:CarrierAdapterConfig[]):QuoteProvider[]{
 return configs.filter(x=>x.id&&x.endpoint&&x.apiKeyEnv).map(x=>new HttpCarrierAdapter(x));
}
