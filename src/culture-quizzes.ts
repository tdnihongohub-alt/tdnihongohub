import { cultureWeeks } from './culture-content';
import { cultureFestivalWeeks } from './culture-festivals';
import type { CultureFact,CultureWeek } from './culture-content';
import type { FormQuestion } from './assignment-scheduling';
export const cultureEdition='2026-11';
export const cultureCheckedAt='2026-11-21';
const ordered=[...cultureWeeks,...cultureFestivalWeeks].sort((a,b)=>a.week-b.week);
function shuffle<T>(rows:T[],seed:number){const next=rows.slice();let state=seed>>>0;for(let i=next.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[next[i],next[j]]=[next[j],next[i]];}return next;}
function question(facts:CultureFact[],index:number,week:number,variant:'A'|'B',slot:number):FormQuestion{
 const [term,meaning,scenario]=facts[index],reverse=variant==='B'&&!scenario;
 const clean=(t:string)=>t.toLowerCase().replace(/（.*?）/g,'').replace(/[^a-z0-9]/g,'');
 const aliases:Record<number,number[][]>={24:[[12,13]],27:[[9,10],[9,11]],32:[[11,12]]};
 const ambiguous=(i:number)=>clean(term).includes(clean(facts[i][0]))||clean(facts[i][0]).includes(clean(term))||(aliases[week]||[]).some(pair=>pair.includes(index)&&pair.includes(i));
 const pool=facts.map((f,i)=>({f,i})).filter(x=>x.i!==index&&!ambiguous(x.i));
 const picked=week===11&&index===0?facts.filter((_,i)=>[2,5,8].includes(i)):shuffle(pool,week*109+index*71+(variant==='A'?11:37)).slice(0,3).map(x=>x.f);
 const distractors=picked.map(f=>reverse?f[1]:f[0]);
 const correct=reverse?meaning:term;distractors.splice(slot,0,correct);
 const stem=variant==='A'?`Identify the term, event or fact described: ${meaning}`:scenario||`Which description correctly defines “${term}” in this topic?`;
 return {id:`CUL-W${String(week).padStart(2,'0')}-${variant}-Q${String(index+1).padStart(2,'0')}`,label:stem,type:'choice',required:true,options:distractors,correctOption:slot,explanation:`${term}: ${meaning}`};
}
export type CultureQuiz={id:string;week:number;topic:string;title:string;variant:'A'|'B';focus:string;questions:FormQuestion[];sources:string[];checkedAt:string};
export const cultureQuizzes:CultureQuiz[]=ordered.flatMap(w=>{
 if(w.facts.length!==20)throw Error(`Culture Week ${w.week} must contain exactly 20 learning points.`);
 return (['A','B'] as const).map(variant=>{
  const slots=shuffle(Array.from({length:20},(_,i)=>i%4),w.week*97+(variant==='A'?13:53));
  return {id:`CUL-W${String(w.week).padStart(2,'0')}-${variant}`,week:w.week,topic:w.title,title:`Week ${w.week} · ${w.title} · Quiz ${variant==='A'?'1':'2'}`,variant,focus:variant==='A'?'Foundations & recognition':'Application & understanding',questions:w.facts.map((_,i)=>question(w.facts,i,w.week,variant,slots[i])),sources:w.sources,checkedAt:cultureCheckedAt};
 });
});
const firstRevision=ordered.slice(0,20).map(w=>w.facts[0]);
const secondRevision=[...ordered.slice(20).map(w=>w.facts[0]),...ordered.slice(0,13).map(w=>w.facts[12])];
for(const [variant,facts] of [['A',firstRevision],['B',secondRevision]] as const){
 const slots=shuffle(Array.from({length:20},(_,i)=>i%4),331+(variant==='A'?13:53));
 cultureQuizzes.push({id:`CUL-W33-${variant}`,week:33,topic:'Revision',title:`Week 33 · Revision · Quiz ${variant==='A'?'1':'2'}`,variant,focus:variant==='A'?'Mixed foundations':'Mixed review & application',questions:facts.map((_,i)=>question(facts,i,33,variant,slots[i])),sources:[...new Set(ordered.flatMap(w=>w.sources))],checkedAt:cultureCheckedAt});
}
export function cultureQuizTemplate(quiz:CultureQuiz,courseId=''){
 return {title:quiz.title,courseId,batchId:'',audience:'course',batchIds:[],lessonId:'',instructions:`${quiz.focus}. Answer all 20 multiple-choice questions, then submit to see your score and the correct answers. One mark per question.`,kind:'form',responseMode:'questions',autoGrade:true,formQuestions:quiz.questions,maxMark:20,published:false,allowLate:true,sourceQuizId:quiz.id,sourceEdition:cultureEdition,sourceReferences:quiz.sources,sourceCheckedAt:quiz.checkedAt,cultureWeek:quiz.week,cultureTopic:quiz.topic};
}
