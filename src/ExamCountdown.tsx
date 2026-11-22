import { useEffect,useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { readable,today } from './domain';
import type { Row } from './domain';
import { daysBetween,validDate } from './timetable-management';

export function ExamCountdowns({courses}:{courses:Row[]}){
 const [date,setDate]=useState(today);
 useEffect(()=>{
  const timer=setInterval(()=>setDate(today()),60000);
  return()=>clearInterval(timer);
 },[]);
 const exams=courses.filter(course=>validDate(course.examDate||'')&&course.examDate>=date).sort((a,b)=>a.examDate.localeCompare(b.examDate));
 if(!exams.length)return null;
 return <div className="exam-countdowns">{exams.map(course=>{
  const remaining=daysBetween(date,course.examDate);
  return <section className="exam-countdown" aria-label={course.title+' exam countdown'} key={course.id}>
   <div><span className="exam-countdown-label"><CalendarDays size={16}/> Exam countdown</span><h2>{course.title}</h2><p>{readable(course.examDate)} · {course.examQuote?.trim()||'One question today is one more thing you’ll know on exam day.'}</p></div>
   <strong>{remaining===0?'Exam day':remaining===1?'1 day left':remaining+' days left'}</strong>
  </section>;
 })}</div>;
}

