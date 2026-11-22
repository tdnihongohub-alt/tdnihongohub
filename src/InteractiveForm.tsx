import { useState } from 'react';
import type { FormQuestion } from './assignment-scheduling';
import { validateFormAnswers } from './assignment-scheduling';

type Answers=Record<string,string|string[]>;
export const answered=(value?:string|string[])=>Array.isArray(value)?value.length>0:!!value?.trim();

export function InteractiveForm({questions,answers,onChange,onSubmit,busy,autoGrade=false}:{questions:FormQuestion[];answers:Answers;onChange:(answers:Answers)=>void;onSubmit:()=>void;busy:boolean;autoGrade?:boolean}){
 const [index,setIndex]=useState(0),[review,setReview]=useState(false),[error,setError]=useState('');
 const q=questions[index],count=questions.filter(q=>answered(answers[q.id])).length;
 const update=(value:string|string[])=>{onChange({...answers,[q.id]:value});setError('');};
 function next(){try{validateFormAnswers([q],answers);setError('');if(index<questions.length-1)setIndex(index+1);else{validateFormAnswers(questions,answers);setReview(true);}}catch(e){const missing=questions.findIndex(item=>{try{validateFormAnswers([item],answers);return false;}catch{return true;}});if(missing>=0)setIndex(missing);setError((e as Error).message);}}
 if(!q)return <p className="notice-bar">Your teacher has not added questions yet.</p>;
 return <section className="interactive-work" aria-label="Interactive class activity" aria-busy={busy}>
  <div className="interactive-work-head"><span>YOUR CLASS ACTIVITY</span><strong>{count} / {questions.length} answered</strong></div>
  <progress aria-label="Questions answered" max={questions.length} value={count}/>
  <nav className="interactive-question-nav" aria-label="Activity questions">{questions.map((item,i)=><button type="button" key={item.id} disabled={busy} aria-label={`Question ${i+1}${answered(answers[item.id])?', answered':''}`} aria-current={!review&&index===i?'step':undefined} className={answered(answers[item.id])?'answered':''} onClick={()=>{setIndex(i);setReview(false);setError('');}}>{i+1}</button>)}</nav>
  {review?<div className="interactive-review"><h3>Ready to send?</h3><p>{autoGrade?'Check your answers, then submit to see your practice score, correct answers and explanations.':'Check your answers. Your teacher will review your work and add feedback.'}</p>{questions.map((item,i)=><div className="interactive-review-row" key={item.id}><div><strong>{i+1}. {item.label}</strong><p className="preserve-lines">{Array.isArray(answers[item.id])?(answers[item.id] as string[]).join(', '):answers[item.id]||'Not answered (optional)'}</p></div><button type="button" className="button small" disabled={busy} onClick={()=>{setIndex(i);setReview(false);}}>Edit<span className="sr-only"> question {i+1}</span></button></div>)}<button type="button" className="button primary" disabled={busy} onClick={onSubmit}>{busy?'Submitting…':autoGrade?'Submit & check answers':'Submit to teacher'}</button></div>:<>
   <fieldset className="interactive-question" disabled={busy}><legend><small>QUESTION {index+1} OF {questions.length} · {q.required?'REQUIRED':'OPTIONAL'}</small><span className="preserve-lines">{q.label}</span></legend>
    {q.type==='short'||q.type==='long'?<label className="form-field"><span>Your answer</span>{q.type==='long'?<textarea rows={5} value={String(answers[q.id]||'')} onChange={e=>update(e.target.value)}/>:<input value={String(answers[q.id]||'')} onChange={e=>update(e.target.value)}/>}</label>:<div className="interactive-options"><p className="form-note">{q.type==='choice'?'Choose one answer.':'Choose all answers that apply.'}</p>{q.options.map((option,i)=>{const selected=q.type==='choice'?answers[q.id]===option:Array.isArray(answers[q.id])&&(answers[q.id] as string[]).includes(option);return <label key={option} className={`interactive-option ${selected?'selected':''}`}><input type={q.type==='choice'?'radio':'checkbox'} name={`question-${q.id}`} checked={selected} onChange={e=>{if(q.type==='choice')update(option);else{const values=Array.isArray(answers[q.id])?answers[q.id] as string[]:[];update(e.target.checked?[...values,option]:values.filter(v=>v!==option));}}}/><span className="interactive-option-letter" aria-hidden="true">{String.fromCharCode(65+i)}</span><span>{option}</span></label>;})}</div>}
   </fieldset>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="interactive-controls"><button type="button" className="button" disabled={busy||index===0} onClick={()=>{setIndex(index-1);setError('');}}>Previous</button><button type="button" className="button primary" disabled={busy} onClick={next}>{index===questions.length-1?'Review answers':'Next question'}</button></div>
  </>}
 </section>;
}
