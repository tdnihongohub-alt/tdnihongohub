import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { cultureQuizzes,cultureQuizTemplate } from '../src/culture-quizzes';
import { cultureWeeks } from '../src/culture-content';
import { cultureFestivalWeeks } from '../src/culture-festivals';
import { autoQuizResult,submissionNeedsReview } from '../src/auto-quiz';
import { AssignedPracticeQuizzes } from '../src/AssignedPracticeQuizzes';
import { validateSchedule } from '../src/assignment-scheduling';
import { AutoQuizResult } from '../src/AutoQuizResult';
import { FormQuestionBuilder } from '../src/FormQuestionBuilder';
import { InteractiveForm } from '../src/InteractiveForm';
import { AssignmentEditor } from '../src/AssignmentEditor';
import CultureQuizLibrary from '../src/CultureQuizLibrary';
import { ScheduledWork } from '../src/ScheduledWork';
import { StudentMarks } from '../src/StudentResults';
import { AppContext } from '../src/store';
import { emptyData,validate } from '../src/domain';
import type { Row } from '../src/domain';

const quiz=cultureQuizzes[0];
const assignment:Row={...cultureQuizTemplate(quiz,'culture'),id:'culture-quiz',worksheetUrl:'',dueDate:'2027-01-01',deadlineAt:1800000000000,releaseAt:0};
const answers=Object.fromEntries(quiz.questions.map(q=>[q.id,q.options[q.correctOption!]]));
function fixture(){const d=emptyData();d.courses=[{id:'culture',title:'Japanese Culture',category:'Culture'}];d.batches=[{id:'b',courseId:'culture',name:'Culture batch',active:true}];d.students=[{id:'s',active:true}];d.enrollments=[{id:'e',studentId:'s',courseId:'culture',batchId:'b',status:'active'}];d.assignments=[{...assignment,published:true}];return d;}
function render(node:React.ReactNode,data=fixture(),path='/student/assignments?assignment=culture-quiz'){return renderToStaticMarkup(<AppContext.Provider value={{data,studentId:'s',identity:{uid:'u',teacher:true,verified:true},save:async()=>{},notify:()=>{}} as any}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AppContext.Provider>);}

describe('complete Culture collection',()=>{
 it('contains two 20-question quizzes for each requested week, without inventing missing weeks',()=>{
  expect([...new Set(cultureQuizzes.map(q=>q.week))]).toEqual([1,2,3,4,5,6,7,9,10,11,13,14,16,17,18,20,22,23,24,25,26,27,28,29,30,31,32,33]);
  expect(cultureQuizzes).toHaveLength(56);expect(cultureQuizzes.flatMap(q=>q.questions)).toHaveLength(1120);
  for(const week of new Set(cultureQuizzes.map(q=>q.week)))expect(cultureQuizzes.filter(q=>q.week===week).map(q=>q.variant)).toEqual(['A','B']);
  expect(new Set(cultureQuizzes.map(q=>q.id)).size).toBe(56);expect(new Set(cultureQuizzes.flatMap(q=>q.questions.map(q=>q.id))).size).toBe(1120);
 });
 it.each(cultureQuizzes)('$id has a complete, balanced answer key and a valid editable draft',q=>{
  expect(q.questions).toHaveLength(20);
  for(const question of q.questions){expect(question.type).toBe('choice');expect(question.required).toBe(true);expect(question.options).toHaveLength(4);expect(new Set(question.options).size).toBe(4);expect(question.options.every(o=>!!o.trim())).toBe(true);expect(question.correctOption).toBeGreaterThanOrEqual(0);expect(question.correctOption).toBeLessThan(4);expect(question.label.length).toBeGreaterThan(25);expect(question.explanation!.length).toBeGreaterThan(10);}
  expect([0,1,2,3].map(slot=>q.questions.filter(q=>q.correctOption===slot).length)).toEqual([5,5,5,5]);
  expect(q.sources.length).toBeGreaterThan(0);for(const url of q.sources)expect(new URL(url).protocol).toBe('https:');
  const draft={...assignment,...cultureQuizTemplate(q,'culture')};expect(draft.published).toBe(false);expect(draft.batchIds).toEqual([]);expect(draft.batchId).toBe('');expect(()=>validate('assignments',draft)).not.toThrow();
 });
 it('uses February and distinct question sets for the paired quizzes',()=>{expect(cultureQuizzes.find(q=>q.week===22)!.topic).toContain('2月');expect(cultureQuizzes.find(q=>q.week===22)!.topic).toContain('February');for(let i=0;i<56;i+=2){expect(cultureQuizzes[i].questions.map(q=>q.label)).not.toEqual(cultureQuizzes[i+1].questions.map(q=>q.label));}});
 it('revision includes learning points from all 27 preceding topics',()=>{const review=cultureQuizzes.filter(q=>q.week===33).flatMap(q=>q.questions.map(q=>q.explanation));for(const week of [...cultureWeeks,...cultureFestivalWeeks])expect(review).toContain(`${week.facts[0][0]}: ${week.facts[0][1]}`);expect(new Set(review).size).toBe(40);});
});
describe('automatic practice scoring',()=>{
 it('scores correct, wrong and mixed answers without changing an assignment or submission',()=>{
  const before=structuredClone(assignment);expect(autoQuizResult(assignment,answers)).toMatchObject({score:20,total:20,percentage:100});
  const wrong=Object.fromEntries(quiz.questions.map(q=>[q.id,q.options[(q.correctOption!+1)%4]]));expect(autoQuizResult(assignment,wrong).score).toBe(0);
  const mixed={...wrong,...Object.fromEntries(quiz.questions.slice(0,13).map(q=>[q.id,answers[q.id]]))};expect(autoQuizResult(assignment,mixed)).toMatchObject({score:13,percentage:65});expect(assignment).toEqual(before);
 });
 it('rejects unanswered, invalid and incomplete answer keys',()=>{
  expect(()=>autoQuizResult(assignment,{})).toThrow('Please answer');expect(()=>autoQuizResult(assignment,{...answers,[quiz.questions[0].id]:'forged answer'})).toThrow('valid option');
  const bad={...assignment,formQuestions:[{...quiz.questions[0],correctOption:99}]};expect(()=>autoQuizResult(bad,answers)).toThrow('answer key');expect(()=>validateSchedule(bad)).toThrow('valid correct answer');expect(()=>autoQuizResult({...assignment,autoGrade:false},answers)).toThrow();
 });
 it('leaves successfully checked practice out of the teacher review queue, while flagging incomplete keys',()=>{const submitted={id:'s_q',status:'submitted',formAnswers:answers};expect(submissionNeedsReview(assignment,submitted)).toBe(false);expect(submissionNeedsReview({...assignment,autoGrade:false},submitted)).toBe(true);expect(submissionNeedsReview(assignment,{...submitted,formAnswers:{}})).toBe(true);expect(submissionNeedsReview(assignment,{...submitted,status:'draft'})).toBe(false);});
 it('lists assigned quizzes only for approved students after release',()=>{const data=fixture();expect(render(<AssignedPracticeQuizzes/>,data)).toContain(quiz.title);data.assignments[0].published=false;expect(render(<AssignedPracticeQuizzes/>,data)).toBe('');data.assignments[0].published=true;data.assignments[0].releaseAt=4102444800000;expect(render(<AssignedPracticeQuizzes/>,data)).toBe('');data.assignments[0].releaseAt=0;data.enrollments[0].status='suspended';expect(render(<AssignedPracticeQuizzes/>,data)).toBe('');});
 it('reveals marks and explanations only after submission, including when reopened later',()=>{
  for(const status of ['draft','submitted','reviewed','returned']){const html=renderToStaticMarkup(<AutoQuizResult assignment={assignment} submission={{id:'s_a',status,formAnswers:answers}}/>);if(status==='draft')expect(html).toBe('');else{expect(html).toContain('20 / 20 marks');expect(html).toContain('Correct answer:');expect(html).toContain('Automatically checked practice score');}}
  const form=renderToStaticMarkup(<InteractiveForm questions={quiz.questions} answers={{}} onChange={()=>{}} onSubmit={()=>{}} busy={false} autoGrade/>);expect(form).not.toContain('Correct answer:');expect(form).not.toContain(quiz.questions[0].explanation);
 });
 it('shows submitted results inside the student assignment without awarding an official mark',()=>{
  const data=fixture();data.submissions=[{id:'s_culture-quiz',studentId:'s',assignmentId:assignment.id,courseId:'culture',formAnswers:answers,status:'submitted',mark:'',feedback:'',submittedAt:'2026-11-21T10:00:00Z'}];
  const html=render(<ScheduledWork/>,data);expect(html).toContain('20 / 20 marks');expect(html).toContain('Correct answer:');expect(html).not.toContain('Save draft');
  const history=render(<StudentMarks/>,data,'/student/marks?view=practice');expect(history).toContain('20 / 20');expect(history).toContain('View result');
  const official=render(<StudentMarks/>,data,'/student/marks');expect(official).toContain('No reviewed marks yet');expect(data.submissions[0].mark).toBe('');
 });
 it('preserves normal teacher-reviewed forms and supports editing the automatic answer key',()=>{
  const builder=renderToStaticMarkup(<FormQuestionBuilder questions={quiz.questions.slice(0,1)} setQuestions={()=>{}} autoGrade/>);expect(builder).toContain('Correct answer');expect(builder).toContain('Explanation (shown after submission)');expect(builder).not.toContain('Short answer');
  const editor=render(<AssignmentEditor initialTemplate={cultureQuizTemplate(quiz,'culture')} onClose={()=>{}}/>);expect(editor).toContain('Automatically check multiple-choice');expect(editor).toContain('Save draft');expect(editor).toContain('Japanese Culture');expect(editor).toContain('Correct answer');
 });
 it('keeps all 56 templates in the teacher library without saving or publishing existing records',()=>{const data=fixture(),before=structuredClone(data);const html=render(<CultureQuizLibrary/>,data);expect((html.match(/Configure quiz/g)||[])).toHaveLength(55);expect((html.match(/Edit saved quiz/g)||[])).toHaveLength(1);expect(html).toContain('Unpublished templates');expect(html).toContain('Revision');expect(data).toEqual(before);});
});
