import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { emptyData } from '../src/domain';
import { AppContext } from '../src/store';
import { ScheduledWork } from '../src/ScheduledWork';
import { TeacherRecords } from '../src/Teacher';
import { quizSharePath,quizShareUrl } from '../src/quiz-sharing';
import { loginDestination,loginUrl } from '../src/login-navigation';

function fixture(){const data=emptyData();data.courses=[{id:'n5',title:'N5',published:true,access:'paid'}];data.students=[{id:'student',active:true}];data.batches=[{id:'batch',courseId:'n5',name:'N5 squad',active:true}];data.enrollments=[{id:'student_batch',studentId:'student',batchId:'batch',courseId:'n5',status:'active'}];data.courseAccess=[{id:'student_n5',studentId:'student',courseId:'n5',active:true}];data.assignments=[{id:'quiz / 1',title:'Weekly grammar quiz',kind:'form',courseId:'n5',batchId:'batch',published:true,releaseAt:0,deadlineAt:4102444800000,allowLate:true,instructions:'Choose the correct answer.',formQuestions:[{id:'q',type:'choice',label:'Private class question',required:true,options:['A','B']}]}];return data;}
function render(data:ReturnType<typeof fixture>,node:React.ReactNode,path:string,teacher=false){return renderToStaticMarkup(<AppContext.Provider value={{data,studentId:'student',demo:true,identity:{uid:'account',teacher,verified:true},notify:()=>{}} as any}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AppContext.Provider>);}
describe('quiz share links',()=>{
 it('produces exact production links and keeps quiz, topic and query through sign-in',()=>{
  for(const target of [{kind:'assignment',id:'quiz / 1'},{kind:'monthly',id:'N5-B01'},{kind:'practice',courseId:'n5',topic:'日本語 & grammar'}] as const){
   const path=quizSharePath(target),login=loginUrl(path);
   expect(quizShareUrl(target)).toBe('https://tdnihongohub.com'+path);expect(loginDestination(login.slice(login.indexOf('?')),false)).toBe(path);
  }
  expect(quizSharePath({kind:'assignment',id:'quiz / 1'})).toBe('/student/assignments?assignment=quiz%20%2F%201');
  expect(()=>quizSharePath({kind:'assignment',id:''})).toThrow('Save the quiz');
 });
 it('opens the selected quiz for an enrolled student and exposes its copy control',()=>{
  const data=fixture(),html=render(data,<ScheduledWork/>,'/student/assignments?assignment=quiz%20%2F%201');
  expect(html).toContain('Private class question');expect(html).toContain('Copy quiz link: Weekly grammar quiz');expect(html).not.toContain('This shared quiz or assignment is not available');
 });
 it('does not reveal unavailable questions through a shared link',()=>{
  for(const unavailable of ['unapproved','draft','scheduled']){
   const data=fixture();if(unavailable==='unapproved')data.enrollments=[];if(unavailable==='draft')data.assignments[0].published=false;if(unavailable==='scheduled')data.assignments[0].releaseAt=4102444800000;
   const before=structuredClone(data),html=render(data,<ScheduledWork/>,'/student/assignments?assignment=quiz%20%2F%201');
   expect(html).toContain('This shared quiz or assignment is not available');expect(html).not.toContain('Private class question');expect(data).toEqual(before);
  }
 });
 it('provides a copy action beside a teacher-created quiz in the teacher table',()=>{
  const data=fixture(),html=render(data,<TeacherRecords/>,'/teacher/lessons?view=assignments',true);
  expect(html).toContain('Copy quiz link: Weekly grammar quiz');expect(html).toContain('Weekly grammar quiz');
 });
});
