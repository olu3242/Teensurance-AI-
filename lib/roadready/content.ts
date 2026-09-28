import {published,contentStatuses} from './governance';
import {categories,type GameMode,type LearningCategory,type LearningChallenge,type RoadLearningConcept} from './types';
// Educational summaries, not eligibility rules. Device meanings trace to federal MUTCD;
// Texas signals trace separately to Transportation Code 544.007–008.
const fhwa='https://mutcd.fhwa.dot.gov/pdfs/11th_Edition/';
const sources:Record<LearningCategory,[string,string]>={
 regulatory_sign:[fhwa+'part2b.pdf','Chapter 2B: regulatory signs'],
 warning_sign:['https://mutcd.fhwa.dot.gov/htm/2009/part2/part2c.htm','Chapter 2C: foundational warning sign meanings (2009 reference)'],
 guide_sign:[fhwa+'part2d.pdf','Chapter 2D: guide signs'],
 road_marking:[fhwa+'part3.pdf','Part 3: markings'],
 traffic_signal:['https://statutes.capitol.texas.gov/?code=TN&chapter=TN.544&artSec=544.007&tab=1','544.007–008: signals'],
 dashboard_symbol:['https://www.nhtsa.gov/vehicle-safety/seat-belts','Seat belt safety'],
 intersection:['https://statutes.capitol.texas.gov/docs/TN/pdf/TN.545.pdf','545.151–153: intersections'],
 right_of_way:['https://statutes.capitol.texas.gov/docs/TN/pdf/TN.545.pdf','545.151–156: right of way'],
 hazard_awareness:['https://www.nhtsa.gov/road-safety/teen-driving','Driving distractions and preparation'],
 safe_response:['https://www.nhtsa.gov/road-safety/pedestrian-safety','Driving safely around pedestrians'],
};
// id, category, display name, meaning/response, plausible misconception
const rows:[string,LearningCategory,string,string,string][]=[
 ['stop','regulatory_sign','STOP','Come to a complete stop; check for conflicting traffic before proceeding.','Slow down but keep rolling if the intersection looks empty.'],
 ['yield','regulatory_sign','YIELD','Give way to conflicting traffic; stop when necessary.','Other traffic must stop for you.'],
 ['speed-limit','regulatory_sign','SPEED LIMIT','This sign displays the regulatory speed limit for this road.','This is a target speed regardless of conditions.'],
 ['do-not-enter','regulatory_sign','DO NOT ENTER','Do not enter the roadway from this direction.','Enter cautiously if no vehicles are visible.'],
 ['wrong-way','regulatory_sign','WRONG WAY','This warns that you are traveling against the permitted direction.','This identifies a detour route.'],
 ['one-way','regulatory_sign','ONE WAY','Traffic travels only in the direction shown by the arrow.','Traffic may move in either direction.'],
 ['no-left-turn','regulatory_sign','NO LEFT TURN','The indicated left turn is prohibited at this location.','A left turn is required.'],
 ['no-u-turn','regulatory_sign','NO U TURN','A U-turn is prohibited at this location.','A U-turn is recommended here.'],
 ['keep-right','regulatory_sign','KEEP RIGHT','Pass to the right of the obstruction indicated by the sign.','Move left of the obstruction.'],
 ['road-closed','regulatory_sign','ROAD CLOSED','The roadway is closed; follow the designated detour.','The road is open to through traffic.'],
 ['curve','warning_sign','Curve ahead','Expect a curve in the direction shown; prepare before reaching it.','The roadway continues straight.'],
 ['winding-road','warning_sign','Winding road','Expect a series of curves ahead.','Only one sharp turn follows.'],
 ['merge','warning_sign','Merging traffic','Expect another traffic stream to join the roadway.','Your lane necessarily ends immediately.'],
 ['lane-reduction','warning_sign','Lane reduction','One lane ends ahead; plan a safe merge.','An extra through lane starts ahead.'],
 ['slippery','warning_sign','Slippery when wet','The roadway may become slippery in wet conditions.','Traction is unchanged when it rains.'],
 ['school','warning_sign','School crossing','Watch for children and the marked school crossing.','Only adults use this crossing.'],
 ['pedestrian','warning_sign','Pedestrian crossing','Expect people crossing and prepare to respond.','Pedestrians are prohibited here.'],
 ['bicycle','warning_sign','Bicycle crossing','Watch for bicyclists entering or crossing the roadway.','Bicycles cannot be present here.'],
 ['railroad','warning_sign','Railroad advance warning','A railroad crossing is ahead; look for its controls.','The railroad crossing is permanently closed.'],
 ['construction','warning_sign','Road work ahead','Prepare for temporary traffic patterns and workers ahead.','Normal lane patterns are guaranteed.'],
 ['divided-highway','warning_sign','Divided highway begins','A median or divider separates opposing traffic ahead.','Opposing traffic will join your lane.'],
 ['divided-end','warning_sign','Divided highway ends','The physical separation of opposing traffic ends ahead.','A new median begins ahead.'],
 ['two-way','warning_sign','Two-way traffic','Expect opposing traffic on the road ahead.','All lanes travel in your direction.'],
 ['signal-ahead','warning_sign','Signal ahead','A traffic signal is ahead; prepare to respond to it.','The next intersection has no signal.'],
 ['stop-ahead','warning_sign','Stop ahead','A stop sign is ahead; prepare to stop.','You have priority at the next intersection.'],
 ['narrow-bridge','warning_sign','Narrow bridge','The bridge ahead is narrower than the approach roadway.','The roadway widens on the bridge.'],
 ['hospital','guide_sign','Hospital','This service sign identifies access to a hospital.','This sign identifies a parking restriction.'],
 ['exit','guide_sign','Exit direction','The arrow and destination help identify an exit route.','The arrow requires an abrupt lane change.'],
 ['red','traffic_signal','Steady red','Stop at the required stopping location; do not treat red as permission to go straight.','Proceed straight if the roadway appears empty.'],
 ['yellow','traffic_signal','Steady yellow','Green is ending and red will follow; prepare to stop safely.','Accelerate to beat the red light.'],
 ['green','traffic_signal','Steady green','Proceed only when the path is clear, yielding to traffic and pedestrians lawfully in the intersection.','Green guarantees that the intersection is clear.'],
 ['red-arrow','traffic_signal','Red arrow','Stop first. Check posted restrictions and official Texas guidance before considering any turn.','Turn immediately in the arrow direction.'],
 ['yellow-arrow','traffic_signal','Yellow arrow','The permitted arrow movement is ending; prepare for the next indication.','The arrow guarantees unlimited time to turn.'],
 ['green-arrow','traffic_signal','Green arrow','Proceed cautiously in the indicated direction and yield to lawful intersection users.','Ignore anyone still in the intersection.'],
 ['flashing-red','traffic_signal','Flashing red','Stop, then proceed only after yielding as required.','Continue without stopping.'],
 ['flashing-yellow','traffic_signal','Flashing yellow','Proceed cautiously and watch for conflicts.','Other road users cannot cross your path.'],
 ['walk','traffic_signal','WALK signal','Pedestrians may begin crossing in the indicated direction, watching for vehicles.','Drivers may ignore people entering the crosswalk.'],
 ['dont-walk','traffic_signal','Steady DON’T WALK','Pedestrians should not begin crossing on this indication.','This indication tells pedestrians to start crossing.'],
 ['broken-white','road_marking','Broken white line','Separates same-direction lanes; change lanes only when safe.','Separates traffic moving in opposite directions.'],
 ['solid-white','road_marking','Solid white line','Marks an edge or separates lanes where crossing is discouraged; inspect the roadway context.','Always invites a lane change.'],
 ['broken-yellow','road_marking','Broken yellow line','Separates opposing traffic; passing requires a safe and permitted opportunity.','Separates only same-direction traffic.'],
 ['solid-yellow','road_marking','Solid yellow line','A solid yellow center line on your side marks a no-passing restriction.','Passing is encouraged on your side.'],
 ['double-yellow','road_marking','Double solid yellow','Opposing traffic is separated by a no-passing marking in both directions.','Both directions may pass whenever convenient.'],
 ['stop-line','road_marking','Stop line','Shows where to stop when a sign or signal requires stopping.','Shows where to accelerate.'],
 ['crosswalk','road_marking','Crosswalk markings','Identify a pedestrian crossing area; keep it clear.','Identify an area for vehicle storage.'],
 ['rail-marking','road_marking','Railroad pavement marking','The X and RR marking warns of a railroad crossing ahead.','Indicates a general parking area.'],
 ['all-way-stop','intersection','All-way stop sequence','Yield to a vehicle already in the intersection; proceed only after conflicts are clear.','Entering together is always safe.'],
 ['left-turn','right_of_way','Left-turn conflict','Yield to approaching traffic close enough to present a hazard before turning left.','Turning left automatically gives you priority.'],
 ['emergency','right_of_way','Approaching emergency vehicle','Make room, pull toward the right edge clear of the intersection and stop as required.','Follow closely behind the emergency vehicle.'],
 ['phone-away','hazard_awareness','Put the phone away','Set up navigation and silence distractions before driving.','Answer learning prompts while moving slowly.'],
 ['fatigue','hazard_awareness','Notice fatigue','Pause the trip and arrange rest or another driver when too tired to drive.','Use a learning game to stay awake while driving.'],
 ['hidden-pedestrian','safe_response','Blocked view near a crossing','Slow down and look for a person hidden by a stopped vehicle.','Pass the stopped vehicle without checking.'],
 ['seatbelt','dashboard_symbol','Seat belt reminder','Before moving, check that everyone is properly buckled.','The reminder means airbags replace seat belts.'],
 ['parked-controls','hazard_awareness','Learn controls while parked','Review unfamiliar controls with a guardian while safely parked.','Explore unfamiliar controls during a turn.'],
];
export function modeFor(category:LearningCategory):GameMode{return category==='road_marking'?'Road Markings':category==='traffic_signal'?'Signal Sense':category==='dashboard_symbol'||category==='guide_sign'?'Symbol Match':category.endsWith('_sign')?'Sign Snap':'What Would You Do?'}
const scenarios:Record<string,string>={
 'all-way-stop':'You have stopped at an all-way stop. Another vehicle is already crossing your path. What should you do?',
 'left-turn':'You plan to turn left. An oncoming vehicle is close to the intersection. What should you do?',
 emergency:'An emergency vehicle approaches with emergency signals operating. How should you respond?',
 'phone-away':'Before a supervised drive, your phone keeps receiving messages. How should you prepare?',
 fatigue:'During trip planning you notice you are too tired to stay alert. What should you do?',
 'hidden-pedestrian':'A vehicle has stopped just before a crosswalk and blocks your view. What matters next?',
 'parked-controls':'You are unfamiliar with the controls in the car you will practice in. When should you learn them?',
};
export const concepts:RoadLearningConcept[]=rows.map(([id,category,name,description])=>({id:`US-TX:${id}`,jurisdiction:'US-TX',category,name,description,explanation:description,imageAsset:`/roadready/${category==='road_marking'?'markings':category==='traffic_signal'?'signals':category.endsWith('_sign')?'signs':category==='dashboard_symbol'?'symbols':'scenarios'}/${id}.svg`,assetLabel:`Learning illustration: ${name}`,tags:[category,'foundation'],difficulty:category==='intersection'||category==='right_of_way'?2:1,active:true,sourceUrl:sources[category][0],sourceSection:sources[category][1],contentVersion:'US-TX-2026-09-v1',version:'US-TX-2026-09-v1',status:'published',contentType:['traffic_signal','intersection','right_of_way'].includes(category)?'jurisdiction':'core',source:sources[category][1]}));
export const challenges:LearningChallenge[]=rows.flatMap(([id,category,name,answer,misconception],index)=>Array.from({length:4},(_,variant)=>{
 const prompts=[scenarios[id]||`What does ${name} communicate?`,category==='traffic_signal'?`You approach an intersection showing ${name}. Which response fits the indication?`:`You encounter ${name}. Which interpretation supports a careful decision?`,`A learner says: “${misconception}” Which explanation corrects this?`,`Before a supervised trip, explain ${name}. Which statement belongs in your explanation?`];
 const options=[{id:'meaning',text:answer},{id:'misconception',text:misconception},{id:'unrelated',text:category==='traffic_signal'?'The signal replaces the need to check for hazards.':'This gives priority over every other road user.'}];
 const offset=(index+variant)%3;
 const rotated=[...options.slice(offset),...options.slice(0,offset)];
 return {id:`US-TX:${id}:v${variant+1}`,conceptId:`US-TX:${id}`,mode:modeFor(category),prompt:prompts[variant],options:rotated.map((option,i)=>({id:`choice-${i+1}`,text:option.text})),answerId:`choice-${rotated.findIndex(o=>o.id==='meaning')+1}`,explanation:answer,variant};
}));
export function jurisdictionPack(jurisdiction:string){return {concepts:concepts.filter(c=>c.jurisdiction===jurisdiction&&c.active&&published(c)),challenges:challenges.filter(c=>concepts.some(x=>x.id===c.conceptId&&x.jurisdiction===jurisdiction&&x.active&&published(x)))}}
export function validateContent(cs=concepts,qs=challenges,assetExists:(path:string)=>boolean=()=>true){
 const errors:string[]=[];const ids=new Set<string>();const questionIds=new Set<string>();
 for(const c of cs){if(!contentStatuses.includes(c.status)||!c.version||!c.source)errors.push(`Invalid governance ${c.id}`);if(ids.has(c.id))errors.push(`Duplicate concept ${c.id}`);ids.add(c.id);if(!c.jurisdiction)errors.push(`Missing jurisdiction ${c.id}`);if(!c.explanation.trim())errors.push(`Missing explanation ${c.id}`);if(!categories.includes(c.category))errors.push(`Invalid category ${c.id}`);if(!c.sourceUrl||!c.sourceSection)errors.push(`Missing source ${c.id}`);if(!c.imageAsset||!assetExists(c.imageAsset))errors.push(`Missing asset ${c.id}`)}
 for(const q of qs){if(questionIds.has(q.id))errors.push(`Duplicate challenge ${q.id}`);questionIds.add(q.id);if(!ids.has(q.conceptId))errors.push(`Unknown concept ${q.id}`);if(q.options.length<2||new Set(q.options.map(o=>o.id)).size!==q.options.length||q.options.filter(o=>o.id===q.answerId).length!==1)errors.push(`Invalid answer ${q.id}`);if(!q.explanation.trim())errors.push(`Missing explanation ${q.id}`)}return errors;
}
