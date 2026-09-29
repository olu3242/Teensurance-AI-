export const waitlistStatuses=['NEW','CONTACTED','INVITED','ENROLLED','DECLINED'] as const;
export type WaitlistStatus=typeof waitlistStatuses[number];
export type WaitlistEntry={id:string;email:string;parentName:string;teenCount:number;region:string;referralSource:string;status:WaitlistStatus;notes:string;createdAt:string;updatedAt:string};
