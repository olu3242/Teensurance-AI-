export type ExtractedPolicyField<T=string|number>={
  value?:T;
  confidence:number;
  sourceText?:string;
};
export type PolicyDocumentExtraction={
  carrierName:ExtractedPolicyField<string>;
  annualPremium:ExtractedPolicyField<number>;
  renewalDate:ExtractedPolicyField<string>;
  deductible:ExtractedPolicyField<number>;
  drivers:ExtractedPolicyField<number>;
  vehicles:ExtractedPolicyField<number>;
  coverageFingerprint:ExtractedPolicyField<string>;
  currentDiscounts:string[];
  documentType:'declarations'|'renewal'|'unknown';
  requiresHumanReview:boolean;
  warnings:string[];
};

export interface PolicyDocumentExtractor{
  extract(input:{text:string;mimeType:string}):Promise<PolicyDocumentExtraction>;
}

const money=(text:string)=>{
  const m=text.match(/(?:annual premium|total premium)\s*[:$]?\s*\$?([\d,]+(?:\.\d{2})?)/i);
  return m?Number(m[1].replace(/,/g,'')):undefined;
};
const date=(text:string)=>{
  const m=text.match(/(?:renewal date|policy expires?|expiration date)\s*:?\s*([A-Za-z0-9,\/-]+(?:\s+[A-Za-z0-9,]+)?)/i);
  if(!m)return undefined; const d=new Date(m[1]); return Number.isNaN(d.getTime())?undefined:d.toISOString().slice(0,10);
};
const count=(text:string,label:string)=>{
  const r=new RegExp(`${label}\\s*:?\\s*(\\d+)`,'i'); const m=text.match(r); return m?Number(m[1]):undefined;
};
const deductible=(text:string)=>{
  const m=text.match(/deductible\s*[:$]?\s*\$?([\d,]+)/i); return m?Number(m[1].replace(/,/g,'')):undefined;
};

export const reviewFirstPolicyExtractor:PolicyDocumentExtractor={
 async extract({text}){
   const annualPremium=money(text), renewalDate=date(text), drivers=count(text,'drivers?'), vehicles=count(text,'vehicles?'), ded=deductible(text);
   const carrier=text.match(/(?:carrier|insurance company)\s*:\s*([^\n]+)/i)?.[1]?.trim();
   const discounts=[...text.matchAll(/discount\s*:\s*([^\n]+)/gi)].map(m=>m[1].trim());
   const warnings:string[]=[];
   if(annualPremium===undefined)warnings.push('Annual premium was not confidently identified.');
   if(!renewalDate)warnings.push('Renewal date was not confidently identified.');
   warnings.push('Coverage limits must be normalized and reviewed before savings verification.');
   return {
     carrierName:{value:carrier,confidence:carrier?0.72:0},
     annualPremium:{value:annualPremium,confidence:annualPremium!==undefined?0.86:0},
     renewalDate:{value:renewalDate,confidence:renewalDate?0.82:0},
     deductible:{value:ded,confidence:ded!==undefined?0.75:0},
     drivers:{value:drivers,confidence:drivers!==undefined?0.8:0},
     vehicles:{value:vehicles,confidence:vehicles!==undefined?0.8:0},
     coverageFingerprint:{confidence:0},
     currentDiscounts:discounts,
     documentType:/declarations/i.test(text)?'declarations':/renewal/i.test(text)?'renewal':'unknown',
     requiresHumanReview:true,
     warnings
   };
 }
};
