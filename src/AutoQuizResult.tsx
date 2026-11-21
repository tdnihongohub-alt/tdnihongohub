import './culture-quizzes.css';
import { safeLink } from './domain';
import { CheckCircle2,XCircle,Trophy } from 'lucide-react';
import { autoQuizResult } from './auto-quiz';
import type { Row } from './domain';
export function AutoQuizResult({assignment,submission}:{assignment:Row;submission:Row}){
 if(!assignment.autoGrade||!['submitted','reviewed','returned'].includes(submission.status))return null;
 let result:ReturnType<typeof autoQuizResult>;try{result=autoQuizResult(assignment,submission.formAnswers||{});}catch{return <p className="notice-bar">This response needs teacher review because its answer key or responses are incomplete.</p>;}
 return <section className="auto-quiz-result" aria-label="Automatically checked quiz result"><div className="auto-quiz-score" role="status"><Trophy size={30}/><div><h2>{result.score} / {result.total} marks · {result.percentage}%</h2><p>Automatically checked practice score</p></div></div><h3>Answers & explanations</h3>{result.rows.map((r,i)=><article key={r.question.id} className={`auto-quiz-answer ${r.correct?'correct':'incorrect'}`}><h4>{i+1}. {r.question.label}</h4><p>{r.correct?<CheckCircle2 size={16}/>:<XCircle size={16}/>} Your answer: {r.answer||'Not answered'}</p><p><strong>Correct answer: {r.correctAnswer}</strong></p>{r.question.explanation&&<p>{r.question.explanation}</p>}</article>)}{assignment.sourceReferences?.length>0&&<details><summary>Topic references</summary><ul>{assignment.sourceReferences.filter((url:string)=>!!safeLink(url)).map((url:string)=><li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname} · Reference</a></li>)}</ul></details>}</section>;
}
