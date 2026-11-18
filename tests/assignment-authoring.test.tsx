import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData, validate } from '../src/domain';
import type { Data, Row } from '../src/domain';
import { AppContext } from '../src/store';
import { AssignmentEditor } from '../src/AssignmentEditor';
import { WeeklyClass } from '../src/WeeklyClass';
import { FormResponse, ScheduledWork } from '../src/ScheduledWork';
import { assignmentLessonChoices, validateAssignmentLesson } from '../src/assignment-audience';
import { usesQuestionResponses, validateFormAnswers } from '../src/assignment-scheduling';

const question={id:'q',label:'Choose the reading of 山',type:'choice',options:['やま','かわ'],required:true};
const assignment:Row={id:'work',title:'Week 1 homework',kind:'assignment',responseMode:'questions',courseId:'al',batchId:'a',lessonId:'week-a',instructions:'Read and answer.',maxMark:10,worksheetUrl:'',formQuestions:[question],published:true,releaseAt:0,deadlineAt:4102444800000,dueDate:'2100-01-01'};
function fixture(){
 const data=emptyData();
 data.courses=[{id:'al',title:'A/L Japanese',category:'A/L',access:'paid',published:true,active:true}];
 data.students=[{id:'s',active:true}];
 data.batches=[{id:'a',name:'2027 A/L Theory',courseId:'al',active:true},{id:'b',name:'2028 A/L Theory',courseId:'al',active:true}];
 data.enrollments=[{id:'s_a',studentId:'s',batchId:'a',courseId:'al',status:'active'}];
 data.courseAccess=[{id:'s_al',studentId:'s',courseId:'al',active:true}];
 data.lessons=[{id:'week-a',title:'Particles',weekNumber:1,courseId:'al',batchId:'a',published:true},{id:'week-b',title:'Other class week',weekNumber:1,courseId:'al',batchId:'b',published:true},{id:'shared',title:'Shared reading',weekNumber:2,courseId:'al',batchId:'',published:true}];
 data.assignments=[assignment];return data;
}
function render(node:React.ReactNode,teacher=true,path='/teacher/modules/al?batch=a',prepare?:(data:Data)=>void){
 const data=fixture();prepare?.(data);
 const context={data,studentId:'s',identity:{uid:'u',teacher,verified:true},save:async()=>{},batch:async()=>{},notify:()=>{}} as any;
 return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={node}/><Route path="/teacher/modules/:id" element={node}/><Route path="/student/course/:id" element={node}/></Routes></MemoryRouter></AppContext.Provider>);
}

describe('assignment authoring inside class folders',()=>{
 it('offers teacher creation even before weekly lessons exist and hides authoring from students',()=>{
  const html=render(<WeeklyClass teacher/>,true,'/teacher/modules/al?batch=a&tab=homework',data=>{data.lessons=[];data.assignments=[];});
  expect(html).toContain('Create assignment');expect(html).toContain('This class is selected automatically');
  expect(render(<WeeklyClass/>,false,'/student/course/al?batch=a')).not.toContain('Create assignment');
 });
 it('preselects the class and week and opens native question authoring for new homework',()=>{
  const html=render(<AssignmentEditor initialCourseId="al" initialBatchId="a" initialLessonId="week-a" onClose={()=>{}}/>);
  expect(html).toContain('Create assignment');expect(html).toContain('value="a" selected=""');expect(html).toContain('value="week-a" selected=""');
  expect(html).toContain('Assignment questions');expect(html).toContain('Question 1');expect(html).toContain('Deadline (Sri Lanka time)');
  expect(html).not.toContain('Other class week');expect(html).not.toContain('<iframe');
 });
 it('preserves existing written assignments when opening the editor',()=>{
  const html=render(<AssignmentEditor row={{...assignment,responseMode:undefined,formQuestions:[],instructions:'Original teacher instructions',worksheetUrl:'https://example.com/original.pdf'}} onClose={()=>{}}/>);
  expect(html).toContain('value="written" selected=""');expect(html).toContain('Original teacher instructions');expect(html).toContain('https://example.com/original.pdf');expect(html).not.toContain('Assignment questions');
 });
 it('allows shared or matching weeks and rejects attaching homework to another batch',()=>{
  const data=fixture();expect(assignmentLessonChoices(data,'al','a').map(l=>l.id)).toEqual(['week-a','shared']);
  expect(()=>validateAssignmentLesson(assignment,data)).not.toThrow();
  expect(()=>validateAssignmentLesson({...assignment,lessonId:'week-b'},data)).toThrow('selected course and batch');
  expect(()=>validateAssignmentLesson({...assignment,batchId:'',lessonId:'week-a'},data)).toThrow();
  expect(()=>validateAssignmentLesson({...assignment,lessonId:''},data)).not.toThrow();
 });
 it('validates question-based homework and required student responses while retaining the assignment type',()=>{
  const row=validate('assignments',assignment) as Row;expect(row.kind).toBe('assignment');expect(usesQuestionResponses(row)).toBe(true);
  expect(()=>validate('assignments',{...assignment,formQuestions:[]})).toThrow('Add 1 to 20 questions');
  expect(()=>validateFormAnswers(row.formQuestions,{})).toThrow('Choose the reading');
  expect(()=>validateFormAnswers(row.formQuestions,{q:'かわ'})).not.toThrow();
  expect(usesQuestionResponses({...assignment,responseMode:'written'})).toBe(false);
 });
 it('lets students answer homework on the website and makes those answers available for teacher marking',()=>{
  const html=render(<ScheduledWork/>,false,'/student/assignments?assignment=work');
  expect(html).toContain('Interactive class activity');expect(html).toContain('type="radio"');expect(html).toContain('Choose the reading of 山');expect(html).not.toContain('External worksheet / photo / PDF link');
  const feedback=renderToStaticMarkup(<FormResponse assignment={assignment} submission={{id:'s_work',formAnswers:{q:'やま'}}}/>);
  expect(feedback).toContain('Choose the reading of 山');expect(feedback).toContain('やま');expect(feedback).not.toContain('No typed answer');
 });
});
