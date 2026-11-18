import type { Row } from './domain';
export type FormQuestion={id:string;label:string;type:'short'|'long'|'choice'|'checkbox';required:boolean;options:string[]};
export const usesQuestionResponses=(a:Row)=>a.kind==='form'||a.responseMode==='questions';
export const sriLankaInput=(ms?:number)=>ms?new Date(ms+19800000).toISOString().slice(0,16):'';
export const parseSriLanka=(value:string)=>value?Date.parse(`${value}:00+05:30`):0;
export const assignmentDeadline=(a:Row)=>Number(a.deadlineAt)|| (a.dueDate?Date.parse(`${a.dueDate}T23:59:59+05:30`):0);
export const assignmentReleased=(a:Row,now=Date.now())=>!!a.published&&Number(a.releaseAt||0)<=now;
export const assignmentClosed=(a:Row,now=Date.now())=>!!assignmentDeadline(a)&&now>assignmentDeadline(a)&&a.allowLate===false;
export const scheduleLabel=(ms:number)=>ms?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(new Date(ms)):'No deadline';
export function validateSchedule(a:Row){
 if(!Number.isFinite(a.releaseAt)||a.releaseAt<0||!Number.isFinite(a.deadlineAt)||a.deadlineAt<=0)throw Error('Choose a valid deadline and release time.');
 if(a.releaseAt&&a.deadlineAt<=a.releaseAt)throw Error('The deadline must be after the scheduled release.');
 if(usesQuestionResponses(a)){
  const qs=a.formQuestions as FormQuestion[];
  if(!Array.isArray(qs)||!qs.length||qs.length>20)throw Error('Add 1 to 20 questions for students to answer.');
  const ids=new Set<string>();for(const q of qs){if(ids.has(q.id)||!q.id)throw Error('Question IDs must be unique.');ids.add(q.id);if(!q.label.trim())throw Error('Every question needs a label.');if(!['short','long','choice','checkbox'].includes(q.type))throw Error('Unknown question type.');if(['choice','checkbox'].includes(q.type)&&(q.options.length<2||q.options.some(o=>!o.trim())||new Set(q.options).size!==q.options.length))throw Error('Choice questions need at least two different, non-empty options.');}
 }
}
export function validateFormAnswers(questions:FormQuestion[],answers:Record<string,string|string[]>){for(const q of questions){const answer=answers[q.id];if(q.required&&(!answer||(Array.isArray(answer)?!answer.length:!answer.trim())))throw Error(`Please answer: ${q.label}`);if(q.type==='choice'&&answer&&!q.options.includes(String(answer)))throw Error(`Choose a valid option: ${q.label}`);if(q.type==='checkbox'&&answer&&(!Array.isArray(answer)||answer.some(x=>!q.options.includes(x))))throw Error(`Choose valid options: ${q.label}`);}}
