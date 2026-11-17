import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { lessonContentPlan, lessonQuiz, recordingThumbnail } from '../src/lesson-content';
import { ComingSoon } from '../src/LessonMedia';
import { FormQuestionBuilder } from '../src/FormQuestionBuilder';
const lesson={id:'lesson',title:'My lesson',courseId:'n5',batchId:'a',module:'Reading',notes:'Teacher notes',recordingUrl:'https://youtu.be/abcdefghijk',resourceUrl:'',published:true,visibility:'members',quizState:'linked',quizId:'quiz'};
const activity={id:'quiz',title:'Lesson activity',courseId:'n5',batchId:'a',lessonId:'lesson',kind:'form',instructions:'Answer the questions',worksheetUrl:'',maxMark:10,published:true,releaseAt:0,deadlineAt:4102444800000,dueDate:'2100-01-01',formQuestions:[{id:'q',type:'choice',label:'Read 山',required:true,options:['やま','かわ']}]};
function fixture(){const data=emptyData();data.batches=[{id:'a',courseId:'n5'},{id:'b',courseId:'n5'}];data.students=[{id:'s',active:true}];data.enrollments=[{id:'s_a',studentId:'s',batchId:'a',courseId:'n5',status:'active'}];data.assignments=[activity];return data;}
describe('teacher-managed lesson packages',()=>{
 it('keeps answer choices on separate editable lines in the shared question builder',()=>{
  const html=renderToStaticMarkup(<FormQuestionBuilder questions={activity.formQuestions as any} setQuestions={()=>{}}/>);
  expect(html).toContain('やま\nかわ');
 });
 it('derives the YouTube thumbnail immediately and permits a teacher image override',()=>{
  expect(recordingThumbnail(lesson)).toBe('https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
  expect(recordingThumbnail({...lesson,thumbnailUrl:'https://example.com/custom.jpg'})).toBe('https://example.com/custom.jpg');
  expect(recordingThumbnail({...lesson,recordingUrl:''})).toBe('');
 });
 it('plans a recording and interactive activity together without changing existing records',()=>{
  const data=fixture(),before=structuredClone(data);const changes=lessonContentPlan(data,lesson,activity);
  expect(changes.map(c=>c.table)).toEqual(['assignments','lessons']);expect(data).toEqual(before);
  expect(changes[1].row.recordingUrl).toBe(lesson.recordingUrl);
 });
 it('rejects invalid recordings and quiz links from another batch or course',()=>{
  const data=fixture();expect(()=>lessonContentPlan(data,{...lesson,recordingUrl:'https://example.com/video'})).toThrow('YouTube');
  expect(()=>lessonContentPlan(data,lesson,{...activity,batchId:'b'})).toThrow('same course and batch');
  expect(()=>lessonContentPlan(data,lesson,{...activity,courseId:'n4'})).toThrow();
  expect(()=>lessonContentPlan(data,{...lesson,visibility:'public'})).toThrow('Batch-specific');
 });
 it('shows coming soon for drafts, scheduled work, missing questions and another student’s batch',()=>{
  const data=fixture();expect(lessonQuiz(data,lesson,'s',1000)?.id).toBe('quiz');
  for(const change of [{published:false},{releaseAt:2000},{formQuestions:[]},{batchId:'b'}]){data.assignments=[{...activity,...change}];expect(lessonQuiz(data,lesson,'s',1000)).toBeUndefined();}
  data.assignments=[activity];expect(lessonQuiz(data,{...lesson,quizState:'coming_soon'},'s')).toBeUndefined();
  expect(lessonQuiz(data,lesson,'other')).toBeUndefined();
  const html=renderToStaticMarkup(<ComingSoon/>);expect(html).toContain('Coming soon');expect(html).not.toContain('<a');
 });
});
