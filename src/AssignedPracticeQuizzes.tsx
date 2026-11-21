import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit,ArrowUpRight } from 'lucide-react';
import { useApp } from './store';
import { Badge } from './ui';
import { courseName } from './domain';
import { assignmentForStudent } from './assignment-audience';
import { assignmentReleased,assignmentDeadline,scheduleLabel } from './assignment-scheduling';
import { autoQuizResult } from './auto-quiz';

export function AssignedPracticeQuizzes(){
 const {data,studentId}=useApp();const [now,setNow]=useState(Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
 const quizzes=data.assignments.filter(a=>a.autoGrade&&assignmentForStudent(a,data,studentId)&&assignmentReleased(a,now));
 if(!quizzes.length)return null;
 return <section className="section-gap"><h2>Your class quizzes</h2><div className="student-quiz-grid">{quizzes.map(a=>{const s=data.submissions.find(s=>s.studentId===studentId&&s.assignmentId===a.id&&['submitted','reviewed','returned'].includes(s.status));let score='';if(s)try{const r=autoQuizResult(a,s.formAnswers||{});score=`${r.score} / ${r.total}`;}catch{/* Incomplete answers remain available for teacher review. */}
 return <Link className="student-quiz-card" key={a.id} to={`/student/assignments?assignment=${encodeURIComponent(a.id)}`}><div className="quiz-card-icon"><BrainCircuit size={24}/><span lang="ja">文化</span></div><Badge tone={score?'green':'neutral'}>{score?`Practice result: ${score}`:'Automatically checked'}</Badge><span className="quiz-card-course">{courseName(data,a.courseId)}{a.cultureWeek?` · Week ${a.cultureWeek}`:''}</span><h3>{a.title}</h3><p>{a.formQuestions?.length||0} questions · {a.maxMark} practice marks<br/>Deadline: {scheduleLabel(assignmentDeadline(a))}</p><strong>{s?'View result':'Start quiz'} <ArrowUpRight size={17}/></strong></Link>;})}</div></section>;
}
