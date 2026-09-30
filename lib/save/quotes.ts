export type QuoteRequest={
 householdId:string;coverageFingerprint:string;drivers:number;vehicles:number;
 annualMileage?:number;vehicleVins?:string[];consents:{marketplace:boolean;telematics:boolean};
};
export type QuoteOption={
 provider:string;annualPremium:number;coverageFingerprint:string;source:'carrier'|'quote';
 programIds?:string[];disclosures?:string[];
};
export interface QuoteProvider{
 id:string;
 quote(request:QuoteRequest):Promise<QuoteOption[]>;
}

export class QuoteOrchestrator{
 constructor(private readonly providers:QuoteProvider[]){}
 async compare(request:QuoteRequest){
   if(!request.consents.marketplace)throw new Error('Marketplace consent is required before requesting quotes.');
   const settled=await Promise.allSettled(this.providers.map(p=>p.quote(request)));
   const quotes=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
   return {
     quotes:quotes
       .filter(q=>q.coverageFingerprint===request.coverageFingerprint)
       .sort((a,b)=>a.annualPremium-b.annualPremium),
     providerErrors:settled.filter(x=>x.status==='rejected').length
   };
 }
}

export class ManualQuoteProvider implements QuoteProvider{
 id='manual';
 constructor(private readonly options:QuoteOption[]){}
 async quote(request:QuoteRequest){return this.options.filter(x=>x.coverageFingerprint===request.coverageFingerprint)}
}
