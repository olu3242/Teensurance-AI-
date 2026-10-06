export type SaveNotice={
 type:'opportunity'|'renewal';
 subject:string;
 message:string;
 actionLabel:string;
};

export function savingsOpportunityNotice(reason:string,nextAction:string):SaveNotice{
 return {
  type:'opportunity',
  subject:'SAVE found a new cost opportunity',
  message:reason+' Next action: '+nextAction+' This is an opportunity, not a guaranteed discount or underwriting decision.',
  actionLabel:'Review with SAVE'
 };
}

export function renewalNotice(daysUntilRenewal:number):SaveNotice{
 return {
  type:'renewal',
  subject:'Your insurance renewal review is ready',
  message:'Your recorded policy renewal is '+daysUntilRenewal+' days away. SAVE can help organize evidence and comparable options. Any insurance change remains your decision.',
  actionLabel:'Review renewal'
 };
}
