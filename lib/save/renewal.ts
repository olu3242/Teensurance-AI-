import type {DomainEvent} from '@/lib/os/types';
import type {PolicyBaseline} from './types';

export type RenewalWatchResult={event?:DomainEvent;daysUntilRenewal?:number;shouldNotify:boolean;reason:string};

export function evaluateRenewalWatch(baseline:PolicyBaseline|undefined,now=new Date()):RenewalWatchResult{
 if(!baseline?.renewalDate)return{shouldNotify:false,reason:'No renewal date is recorded.'};
 const renewal=new Date(baseline.renewalDate+'T12:00:00Z');
 if(Number.isNaN(renewal.getTime()))return{shouldNotify:false,reason:'Renewal date is invalid.'};
 const days=Math.ceil((renewal.getTime()-now.getTime())/86400000);
 if(days<0)return{daysUntilRenewal:days,shouldNotify:false,reason:'The recorded renewal date has passed.'};
 const type=days<=14?'policy.renewal_approaching':days<=30?'policy.renewal_30_days':days<=60?'policy.renewal_60_days':undefined;
 return type
  ?{event:{type,metadata:{daysUntilRenewal:days}},daysUntilRenewal:days,shouldNotify:true,reason:'Policy renewal is '+days+' days away.'}
  :{daysUntilRenewal:days,shouldNotify:false,reason:'Renewal is outside the 60-day SAVE review window.'};
}
