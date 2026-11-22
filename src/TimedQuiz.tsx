import { assignmentClosed } from './assignment-scheduling';
import { useEffect,useRef,useState } from 'react';
import { doc,getDoc,runTransaction,serverTimestamp } from '@firebase/firestore';
import { db } from './firebase';
import * as repo from './repository';
import { useApp } from './store';
import { InteractiveForm } from './InteractiveForm';
import { clockLabel,quizEndsAt,quizLimit,quizTimerId } from './quiz-timing';
import type { Row } from './domain';
import './quiz-timing.css';
type Answers=Record<string,string|string[]>;
export function TimedQuiz({assignment:a,previous,busy,onSubmit}:{assignment:Row;previous?:Row;busy:boolean;onSubmit:(answers:Answers,timedOut:boolean,timerId:string)=>Promise<void>}){
 const {studentId,demo,save}=useApp(),id=quizTimerId(studentId,a,previous),cacheKey='td-quiz-'+id;
 const [timer,setTimer]=useState<Row|null>(null),[answers,setAnswers]=useState<Answers>(previous?.formAnswers||{}),[now,setNow]=useState(Date.now()),[starting,setStarting]=useState(false),[error,setError]=useState(''),[draftWarning,setDraftWarning]=useState('');
 const sent=useRef(false),latest=useRef(answers);latest.current=answers;
 function restore(t:Row){setTimer(t);try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.answers&&cached.updatedAt>Date.parse(previous?.submittedAt||'1970-01-01'))setAnswers(cached.answers);}catch{/* The server draft remains available. */}}
 useEffect(()=>{let active=true;sent.current=false;if(demo){try{const cached=JSON.parse(localStorage.getItem(cacheKey+'-timer')||'null');if(cached)restore(cached);}catch{}return;}
  if(db)void getDoc(doc(db,'quizTimers',id)).then(s=>{if(active&&s.exists())restore({...s.data(),id:s.id,startedAtMs:s.data().startedAt.toMillis()});}).catch(e=>{if(active)setError('Could not restore the timer: '+e.message);});return()=>{active=false;};
 },[id,demo]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(t);},[]);
 const remaining=timer?quizEndsAt(a,timer)-now:0,expired=!!timer&&remaining<=0;
 const submitRef=useRef(onSubmit);submitRef.current=onSubmit;
 useEffect(()=>{if(expired&&!busy&&!sent.current){sent.current=true;void submitRef.current(latest.current,true,id);}},[expired,busy,id]);
 function change(next:Answers){if(expired||busy)return;setAnswers(next);try{localStorage.setItem(cacheKey,JSON.stringify({answers:next,updatedAt:Date.now()}));}catch{setDraftWarning('Local backup unavailable. Keep this quiz open until submitted.');}}
 useEffect(()=>{if(!timer||expired||busy)return;const t=setTimeout(()=>{const record={...previous,id:`${studentId}_${a.id}`,studentId,assignmentId:a.id,courseId:a.courseId,answer:'',fileUrl:'',formAnswers:answers,status:'draft',submittedAt:new Date().toISOString(),late:false,history:previous?.history||[],feedback:previous?.feedback||'',mark:previous?.mark??'',timerId:id,timedOut:false};void (demo?save('submissions',record):repo.save('submissions',record)).then(()=>setDraftWarning('')).catch(()=>setDraftWarning('Draft could not sync. Your answers are backed up on this device; reconnect to submit.'));},700);return()=>clearTimeout(t);},[answers,timer,expired]);
 async function start(){setStarting(true);setError('');try{let t:Row;if(demo){t={id,startedAtMs:Date.now(),durationMinutes:quizLimit(a)};localStorage.setItem(cacheKey+'-timer',JSON.stringify(t));}else{if(!db)throw Error('Firebase is not configured.');const ref=doc(db,'quizTimers',id);await runTransaction(db,async tx=>{const old=await tx.get(ref);if(!old.exists())tx.set(ref,{studentId,assignmentId:a.id,attemptNumber:previous?.history?.length||0,durationMinutes:quizLimit(a),startedAt:serverTimestamp()});});const s=await getDoc(ref);t={...s.data(),id,startedAtMs:s.data()!.startedAt.toMillis()};}restore(t);setNow(Date.now());}catch(e){setError((e as Error).message);}finally{setStarting(false);}}
 if(!timer&&assignmentClosed(a))return <p className="notice-bar">The deadline has passed. A new timed attempt cannot be started.</p>;
 return <section className="timed-quiz">{!timer?<div className="quiz-start"><h3>Timed quiz · {quizLimit(a)} minutes</h3><p>The countdown starts when you press Start quiz. Closing this window or refreshing does not pause it. Unanswered questions receive zero practice marks when time runs out.</p><button type="button" className="button primary" disabled={starting||busy} onClick={()=>void start()}>{starting?'Starting…':'Start quiz'}</button>{error&&<p className="error" role="alert">{error}</p>}</div>:<><div className={`quiz-clock ${remaining<=60000?'urgent':''}`} role="timer" aria-label="Time remaining"><strong>{expired?'Time is up':clockLabel(remaining)}</strong><span>{expired?'Your answers are locked. Submitting answers completed so far.':'Time remaining · keep this window open'}</span></div>{expired?<div className="quiz-start"><p>If submission fails, reconnect and press Submit saved answers. The timer will stay at zero.</p><button type="button" className="button primary" disabled={busy} onClick={()=>void onSubmit(latest.current,true,id)}>{busy?'Submitting…':'Submit saved answers'}</button></div>:<InteractiveForm questions={a.formQuestions||[]} answers={answers} onChange={change} autoGrade={!!a.autoGrade} busy={busy} onSubmit={()=>void onSubmit(answers,false,id)}/>} {draftWarning&&<p className="notice-bar" role="status">{draftWarning}</p>}</>}</section>;
}
