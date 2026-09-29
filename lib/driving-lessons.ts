export type LessonCategory='foundations'|'vehicle_control'|'road_awareness'|'intersections'|'parking'|'highway'|'night'|'weather'|'emergency';
export type LessonStatus='not_started'|'in_progress'|'completed';
export type ScenarioChoice={id:string;label:string;safe:boolean;feedback:string};
export type Scenario={id:string;title:string;prompt:string;choices:ScenarioChoice[]};
export type DrivingLesson={
 id:string;
 title:string;
 category:LessonCategory;
 objective:string;
 prerequisites:string[];
 scenarios:Scenario[];
 practiceFocus:string;
 parentDebrief:string;
};

export const drivingLessons:DrivingLesson[]=[
 {id:'L01',title:'Before the car moves',category:'foundations',objective:'Build a repeatable pre-drive safety routine.',prerequisites:[],practiceFocus:'Seat, mirrors, belt, controls, phone away',parentDebrief:'Confirm the teen can complete setup without prompts.',scenarios:[
  {id:'S01',title:'A message arrives before departure',prompt:'The car is still parked and a message appears. What is the safest next action?',choices:[
   {id:'a',label:'Reply quickly before pulling out',safe:false,feedback:'Finish phone tasks before the drive begins, then put the phone away.'},
   {id:'b',label:'Set the phone to driving-safe mode and put it away',safe:true,feedback:'Correct. Resolve phone setup while parked and avoid interaction once moving.'},
   {id:'c',label:'Keep the phone on your lap in case you need it',safe:false,feedback:'A reachable phone can create distraction. Put it away before moving.'}
  ]}
 ]},
 {id:'L02',title:'Smooth starts, stops and turns',category:'vehicle_control',objective:'Practice basic control at low speed with a supervisor.',prerequisites:['L01'],practiceFocus:'Smooth braking, steering, lane position',parentDebrief:'Discuss one thing that felt smooth and one thing to repeat.',scenarios:[
  {id:'S02',title:'Approaching a stop sign',prompt:'You are approaching a stop sign with a pedestrian near the corner. What should you prioritize?',choices:[
   {id:'a',label:'Roll through if the road looks clear',safe:false,feedback:'Come to a complete stop and scan carefully.'},
   {id:'b',label:'Stop fully, scan, and yield as required',safe:true,feedback:'Correct. Full stop, scanning and yielding come before moving.'},
   {id:'c',label:'Watch only the vehicle behind you',safe:false,feedback:'Rear awareness matters, but the intersection and pedestrian risk are primary.'}
  ]}
 ]},
 {id:'L03',title:'Intersections and gap judgment',category:'intersections',objective:'Recognize hazards and choose safe gaps without rushing.',prerequisites:['L02'],practiceFocus:'Scanning, right-of-way, gap selection',parentDebrief:'Review any intersection where the teen felt rushed or uncertain.',scenarios:[
  {id:'S03',title:'Unprotected left turn',prompt:'Traffic is moving quickly and the available gap feels marginal. What should you do?',choices:[
   {id:'a',label:'Take the gap so drivers behind do not get impatient',safe:false,feedback:'Pressure from other drivers should not determine a safety decision.'},
   {id:'b',label:'Wait for a clearly safe gap',safe:true,feedback:'Correct. Waiting is the safer choice when the gap is uncertain.'},
   {id:'c',label:'Move halfway into opposing traffic to force a gap',safe:false,feedback:'Do not create conflict to force a turn.'}
  ]}
 ]},
 {id:'L04',title:'Parking and low-speed maneuvering',category:'parking',objective:'Build controlled, repeatable parking skills.',prerequisites:['L02'],practiceFocus:'Reference points, speed control, observation',parentDebrief:'Review positioning and observation rather than speed of completion.',scenarios:[]},
 {id:'L05',title:'Highway merging',category:'highway',objective:'Prepare for entering, maintaining and exiting higher-speed traffic.',prerequisites:['L03'],practiceFocus:'Acceleration lane, mirrors, blind spot, lane choice',parentDebrief:'Discuss timing and space management after the drive.',scenarios:[]},
 {id:'L06',title:'Night driving',category:'night',objective:'Adjust speed, scanning and following distance for reduced visibility.',prerequisites:['L03'],practiceFocus:'Visibility, glare, following distance',parentDebrief:'Review visibility limits and fatigue signs.',scenarios:[]},
 {id:'L07',title:'Rain and reduced traction',category:'weather',objective:'Recognize when conditions require more space and lower speed.',prerequisites:['L03'],practiceFocus:'Following distance, braking, visibility',parentDebrief:'Discuss how weather changed decision-making.',scenarios:[]},
 {id:'L08',title:'Breakdown and crash response',category:'emergency',objective:'Know what to do after a breakdown, minor crash or unsafe situation.',prerequisites:['L01'],practiceFocus:'Stop safely, hazard awareness, contact plan',parentDebrief:'Confirm the family emergency plan and who to contact first.',scenarios:[]}
];

export function lessonProgress(completed:string[]){
 const done=new Set(completed);
 return drivingLessons.map(l=>({...l,status:(done.has(l.id)?'completed':l.prerequisites.every(p=>done.has(p))?'in_progress':'not_started') as LessonStatus}));
}
