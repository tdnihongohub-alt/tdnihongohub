import { useEffect,useState } from 'react';
import { ArrowUpRight,Play,ClipboardCheck,Sun } from 'lucide-react';
import { addDays,today } from './domain';
import { weekStart } from './timetable-management';
import './LearningRhythm.css';

const learningDays=[
 {day:'Monday',icon:'🗣️',subject:'Conversation',japanese:'会話',message:'Start with a conversation.',detail:'Say it aloud, listen closely, and give your next conversation a little more confidence.'},
 {day:'Tuesday',icon:'📘',subject:'Grammar',japanese:'文法',extra:'2027 A/L Theory recordings',message:'Make the next sentence click.',detail:'Revisit your theory recording, work through the grammar, and put a new sentence into practice.'},
 {day:'Wednesday',icon:'🎎',subject:'Japanese Culture',japanese:'日本文化',message:'Discover the world behind the words.',detail:'Explore Japanese customs and everyday life, then check what you learned with a little practice.'},
 {day:'Thursday',icon:'🈶',subject:'Kanji',japanese:'漢字',message:'One character, one step forward.',detail:'Read, write, and recall. A little kanji practice today adds to what you can recognise tomorrow.'},
 {day:'Friday',icon:'📖',subject:'Reading Comprehension',japanese:'読解',message:'Find meaning, line by line.',detail:'Take your time with the passage. Look for clues, connect the ideas, and try the questions.'},
 {day:'Saturday',icon:'📚',subject:'Literature + Translation',japanese:'文学・翻訳',message:'See a story from a new perspective.',detail:'Read with curiosity and choose your words carefully as you practise literature and translation.'},
 {day:'Sunday',icon:'📝',subject:'Sakubun',japanese:'作文',message:'Let your ideas become Japanese.',detail:'Bring the week together in your writing. Start with one idea and build it into a thoughtful response.'},
];

export function LearningRhythm({date,onSelect}:{date:string;onSelect:(date:string)=>void}){
 const [currentDate,setCurrentDate]=useState(today);
 useEffect(()=>{const timer=setInterval(()=>setCurrentDate(today()),60000);return()=>clearInterval(timer);},[]);
 const weekday=(new Date(date+'T12:00:00Z').getUTCDay()+6)%7;
 const focus=learningDays[weekday],monday=weekStart(date);
 return <section className="learning-rhythm" aria-label="Weekly recordings and quiz guide">
  <div className="rhythm-intro">
   <div><span className="rhythm-eyebrow"><Sun size={15}/> YOUR RECORDINGS & PRACTICE PLAN</span>
    <h2>Every day, <em>a new start.</em></h2>
    <p>A little learning, one day at a time. Revisit your recordings, try a quiz, and make room for your next step.</p>
    <div className="rhythm-formats"><span><Play size={14}/>Recordings</span><span><ClipboardCheck size={14}/>Quizzes & homework</span></div>
   </div>
   <div className="rhythm-focus">
    <span>{date===currentDate?'TODAY’S FOCUS':focus.day.toUpperCase()+'’S FOCUS'} <span lang="ja">{focus.japanese}</span></span>
    <h3>{focus.message}</h3><p>{focus.detail}</p>
    <button type="button" onClick={()=>onSelect(date)}>View {focus.day}’s schedule <ArrowUpRight size={15}/></button>
   </div>
  </div>
  <div className="rhythm-days" aria-label="Learning days">{learningDays.map((item,index)=>{
   const day=addDays(monday,index),active=index===weekday;
   return <button type="button" className={active?'is-selected':''} aria-pressed={active} key={item.day} onClick={()=>onSelect(day)}>
    <span className="rhythm-day-name">{item.day}{day===currentDate&&<small>Today</small>}</span>
    <span className="rhythm-day-icon" aria-hidden="true">{item.icon}</span>
    <strong>{item.subject}</strong><span lang="ja" className="rhythm-japanese">{item.japanese}</span>
    {item.extra&&<span className="rhythm-extra">+ {item.extra}</span>}
   </button>;
  })}</div>
  <p className="rhythm-footnote">Choose a day to see its scheduled classes and released practice. Your teacher’s release dates appear in the timetable below.</p>
 </section>;
}

