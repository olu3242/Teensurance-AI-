import type {Decision,DrivingState,Role,State} from '@/lib/domain';

export type AgentId='T'|'VIBE'|'READY'|'ACE'|'MILES'|'CRUZE'|'GO'|'COVER'|'GUARD';
export type WorkflowId='onboarding'|'permit'|'learning'|'practice'|'verification'|'reflection'|'licensing'|'coverage';
export type WorkflowState='CREATED'|'ASSESSING'|'READY'|'IN_PROGRESS'|'AWAITING_EVIDENCE'|'AWAITING_VERIFICATION'|'VERIFIED'|'COMPLETED'|'HANDOFF'|'BLOCKED'|'DEFERRED'|'DISPUTED'|'REQUIRES_PARENT'|'REQUIRES_CONSENT'|'REQUIRES_OFFICIAL_SOURCE'|'REQUIRES_HUMAN_REVIEW'|'CANCELLED';
export type TriggerPriority='P0'|'P1'|'P2'|'P3'|'P4'|'P5'|'P6'|'P7'|'P8'|'P9';

export type PilotAction='plan'|'safety'|'log'|'reflect'|'verify'|'correct'|'dispute'|'jurisdiction'|'cover'|'goal';

export type OrchestrationCommand={
 action:PilotAction;
 role:Role;
 drivingState:DrivingState;
 requestId?:string;
 [key:string]:unknown;
};

export type TriggerDefinition={
 id:string;
 priority:TriggerPriority;
 source:'user'|'domain'|'state'|'time'|'external'|'safety';
 workflow:WorkflowId;
 agent:AgentId;
 condition?:(state:State,command:OrchestrationCommand)=>boolean;
};

export type WorkflowDefinition={
 id:WorkflowId;
 version:number;
 owner:AgentId;
 allowedActions:PilotAction[];
 completion:(state:State)=>boolean;
 blockers:(state:State)=>string[];
};

export type DomainEvent={
 type:string;
 subjectId?:string;
 metadata?:Record<string,string|number|boolean>;
};

export type OrchestrationTrace={
 trigger:string;
 priority:TriggerPriority;
 workflow:WorkflowId;
 workflowState:WorkflowState;
 agent:AgentId;
 preGuard:Decision;
 postGuard:Decision;
 events:string[];
};

export type OrchestrationResult={
 policy:{decision:Decision;reason:string};
 state:State;
 trace:OrchestrationTrace;
 duplicate?:boolean;
};
