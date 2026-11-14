import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import type { Row } from './domain';
import { today } from './domain';

const words=[{jp:'学ぶ',reading:'manabu',meaning:'to learn'},{jp:'桜',reading:'sakura',meaning:'cherry blossom'},{jp:'一歩',reading:'ippo',meaning:'one step'},{jp:'未来',reading:'mirai',meaning:'future'},{jp:'友達',reading:'tomodachi',meaning:'friend'},{jp:'ありがとう',reading:'arigatō',meaning:'thank you'},{jp:'本',reading:'hon',meaning:'book'}];

export function StudentWelcome({name,completed,total,lesson}:{name:string;completed:number;total:number;lesson?:Row}){
 const [revealed,setRevealed]=useState(false);
 const word=words[Number(today().replaceAll('-',''))%words.length];
 const percent=total?Math.round(completed/total*100):0;
 const lessonPath=lesson?`/student/course/${lesson.courseId}?lesson=${lesson.id}`:'/free-lessons';
 return <div className="student-intro-grid">
  <section className="study-garden-welcome" aria-labelledby="student-greeting">
   <div className="garden-copy"><span className="garden-eyebrow"><span/> YOUR JAPANESE LEARNING SPACE</span><p className="garden-greeting" lang="ja">おかえりなさい。</p><h1 id="student-greeting">Welcome back,<br/><span>{name}.</span></h1><p className="garden-description">A little practice today.<br/>A little more confidence tomorrow.</p><Link className="button primary" to={lessonPath}>{lesson?'Continue learning':'Explore free lessons'}<ArrowUpRight size={17}/></Link></div>
   <div className="garden-illustration"><img src="/images/student-study-garden.svg" alt="" width="520" height="360" fetchPriority="high"/><span lang="ja">日本語を、少しずつ。</span><small>A LITTLE JAPANESE. EVERY DAY.</small></div>
   <span className="garden-corner" aria-hidden="true">01 — 学びの庭</span>
  </section>
  <aside className="journey-overview" aria-label="Your learning progress">
   <div className="journey-heading"><span>YOUR LITTLE STEPS</span><Sparkles size={17}/></div>
   <div className="journey-ring-row"><div className="journey-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="42"/><circle className="ring-fill" cx="50" cy="50" r="42" pathLength="100" strokeDasharray={`${percent} 100`} transform="rotate(-90 50 50)"/></svg><strong>{percent}<small>%</small></strong></div><div><h2>{total?'Every lesson counts.':'A fresh beginning.'}</h2><p>{total?<>{completed} of {total} lessons<br/>completed so far.</>:<>Your first chapter<br/>is waiting for you.</>}</p><Link to={total?'/student/classes':'/free-lessons'}>{total?'My learning journey':'Find a free lesson'}<ArrowRight size={13}/></Link></div></div>
   <div className="daily-word"><div><span><BookOpen size={13}/> TODAY’S LITTLE WORD</span><small lang="ja">今日のことば</small></div><button type="button" className="word-reveal" aria-expanded={revealed} aria-controls="daily-word-meaning" onClick={()=>setRevealed(!revealed)}><strong lang="ja">{word.jp}</strong><span>{revealed?'Hide meaning':'Reveal meaning'}<ArrowUpRight size={13}/></span></button><p id="daily-word-meaning" className="word-meaning">{revealed?<><b>{word.reading}</b><span> · {word.meaning}</span></>:<span>A small discovery for your day.</span>}</p></div>
  </aside>
 </div>;
}
