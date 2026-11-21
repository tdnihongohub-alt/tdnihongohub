import type { Row } from './domain';
import type { FormQuestion } from './assignment-scheduling';
import { validateFormAnswers } from './assignment-scheduling';
export function autoQuizResult(assignment:Row,answers:Record<string,string|string[]>){
 const questions=assignment.formQuestions as FormQuestion[];
 if(!assignment.autoGrade||!questions?.length||questions.some(q=>q.type!=='choice'||!Number.isInteger(q.correctOption)||Number(q.correctOption)<0||Number(q.correctOption)>=q.options.length))throw Error('This quiz does not have a complete automatic answer key.');
 validateFormAnswers(questions,answers);
 const rows=questions.map(q=>({question:q,answer:String(answers[q.id]||''),correctAnswer:q.options[q.correctOption!],correct:answers[q.id]===q.options[q.correctOption!]}));
 const score=rows.filter(r=>r.correct).length;return {score,total:rows.length,percentage:Math.round(score/rows.length*100),rows};
}
export function submissionNeedsReview(assignment:Row|undefined,submission:Row){
 if(submission.status!=='submitted')return false;
 if(!assignment?.autoGrade)return true;
 try{autoQuizResult(assignment,submission.formAnswers||{});return false;}catch{return true;}
}
