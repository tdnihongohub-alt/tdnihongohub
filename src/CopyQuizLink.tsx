import { useEffect,useState } from 'react';
import { Copy,Check } from 'lucide-react';
import { Modal } from './ui';
import { quizShareUrl } from './quiz-sharing';
import type { QuizShareTarget } from './quiz-sharing';
export function CopyQuizLink({target,title='this quiz',label='Copy quiz link'}:{target:QuizShareTarget;title?:string;label?:string}){
 const [copied,setCopied]=useState(false),[manual,setManual]=useState(false),[busy,setBusy]=useState(false);
 const url=quizShareUrl(target);
 useEffect(()=>{setCopied(false);},[url]);
 useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),2500);return()=>clearTimeout(timer);},[copied]);
 return <><button type="button" className="button small" aria-label={`${label}: ${title}`} disabled={busy} onClick={async()=>{setBusy(true);try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(url);setCopied(true);}catch{setManual(true);}finally{setBusy(false);}}}>{copied?<Check size={14}/>:<Copy size={14}/>}<span aria-live="polite">{copied?'Link copied':label}</span></button>{manual&&<Modal title="Share quiz link" onClose={()=>setManual(false)}><div className="pad"><h3>{title}</h3><p>Copy this link and send it to your students.</p><label className="form-field">Quiz link<input readOnly value={url} onFocus={e=>e.currentTarget.select()} onClick={e=>e.currentTarget.select()}/></label><p className="form-note">Students sign in to open the quiz. Publication, release dates and class access still apply.</p><button type="button" className="button" onClick={()=>setManual(false)}>Done</button></div></Modal>}</>;
}
