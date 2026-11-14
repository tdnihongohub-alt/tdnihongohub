import { expect, it } from 'vitest';
import { monthlyBank, markMonthly, monthlyProgress } from '../src/monthly-quizzes';
import { validate } from '../src/domain';
it('publishes all nine reviewed quizzes and marks their 27 keyed answers consistently',()=>{
 expect(monthlyBank.quizzes).toHaveLength(9);
 expect(monthlyBank.quizzes.flatMap(q=>q.questions)).toHaveLength(27);
 for(const quiz of monthlyBank.quizzes){
  expect(markMonthly(quiz,Object.fromEntries(quiz.questions.map(q=>[q.id,q.correctIndex])))).toBe(3);
  expect(markMonthly(quiz,Object.fromEntries(quiz.questions.map(q=>[q.id,(q.correctIndex+1)%4])))).toBe(0);
  expect(()=>markMonthly(quiz,{})).toThrow();
 }
});
it('counts best scores, includes zero-score completion, and excludes other accounts, editions and invalid attempts',()=>{
 const a={id:'1',uid:'me',edition:'2026-11',quizId:'N5-B01',score:1,total:3,completedAt:'2026-11-15T10:00:00Z'};
 const p=monthlyProgress([a,{...a,id:'2',score:3},{...a,id:'3',score:2},{...a,id:'4',quizId:'N4-B01',score:0},{...a,id:'5',uid:'other',quizId:'AL-B01',score:3},{...a,id:'6',edition:'2026-12',quizId:'AL-B01'},{...a,id:'7',quizId:'unknown'},{...a,id:'8',quizId:'AL-B01',score:4}],'me');
 expect(p.points).toBe(3);expect(p.completed).toBe(2);expect(p.history).toHaveLength(4);
 expect(monthlyProgress([a],'').points).toBe(0);
});
it('caps monthly points at 27 even with repeated perfect attempts',()=>{
 const rows=monthlyBank.quizzes.flatMap(q=>[1,2].map(n=>({id:q.id+n,uid:'me',quizId:q.id,edition:monthlyBank.edition,score:3,total:3,completedAt:'2026-11-15T10:00:00Z'})));
 expect(monthlyProgress(rows,'me').points).toBe(27);
});
it('validates monthly attempts independently of paid course access',()=>{
 const row={id:'1',uid:'me',quizId:'AL-B01',edition:'2026-11',score:0,total:3,completedAt:'2026-11-15T10:00:00Z'};
 expect(()=>validate('levelAttempts',row)).not.toThrow();
 for(const change of [{score:4},{score:-1},{score:1.5},{quizId:'unknown'},{total:5},{edition:'2026-12'}])expect(()=>validate('levelAttempts',{...row,...change})).toThrow();
});
