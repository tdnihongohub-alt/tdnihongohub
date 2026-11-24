import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData } from '../src/domain';
import { AppContext } from '../src/store';
import { lessonDeletionPlan } from '../src/lesson-deletion';
import { DeleteLessonButton, DeleteLessonDialog } from '../src/DeleteLessonButton';
import { WeeklyClass } from '../src/WeeklyClass';
import { TeacherRecords } from '../src/Teacher';
import { LessonEditor } from '../src/LessonEditor';

const lesson={id:'one',courseId:'al',batchId:'a',title:'Paper discussion Part 1',weekNumber:3,module:'Papers',notes:'Teacher notes',recordingUrl:'https://youtu.be/abcdefghijk',resourceUrl:'',published:false,visibility:'members'};
function fixture(){
 const data=emptyData();data.courses=[{id:'al',title:'A/L Japanese',category:'A/L',access:'paid',published:true,active:true}];data.batches=[{id:'a',courseId:'al',name:'2027 A/L Paper',active:true}];
 data.students=[{id:'s',active:true}];data.enrollments=[{id:'s_a',studentId:'s',courseId:'al',batchId:'a',status:'active'}];data.courseAccess=[{id:'s_al',studentId:'s',courseId:'al',active:true}];
 data.lessons=[lesson,{...lesson,id:'duplicate',title:'Paper discussion Part I',published:true}];
 data.assignments=[{id:'homework',title:'Paper homework',courseId:'al',batchId:'a',lessonId:'one',published:true,releaseAt:0,deadlineAt:4102444800000,kind:'assignment'}];
 data.sessions=[{id:'meeting',lessonId:'one',title:'',date:'2026-11-20',time:'18:00',batchId:'a',courseId:'al',zoomUrl:'https://example.com/meeting'}];
 return data;
}
function render(node:React.ReactNode,teacher=true,path='/teacher/modules/al?batch=a',prepare?:(data:ReturnType<typeof fixture>)=>void){
 const data=fixture();prepare?.(data);const context={data,identity:{uid:'u',teacher,verified:true},studentId:'s',notify:()=>{},batch:async()=>{},save:async()=>{},deleteLesson:async()=>{}} as any;
 return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}><Routes><Route path="/teacher/modules/:id" element={node}/><Route path="/student/course/:id" element={node}/><Route path="*" element={node}/></Routes></MemoryRouter></AppContext.Provider>);
}
describe('individual lesson deletion',()=>{
 it('detaches only the selected lesson links and keeps other lesson records and student work unchanged',()=>{
  const data=fixture();data.assignments.push({...data.assignments[0],id:'other-homework',lessonId:'duplicate'});data.submissions=[{id:'response',assignmentId:'homework',mark:8}];
  const before=structuredClone(data),plan=lessonDeletionPlan(data,'one');
  expect(plan.lesson.id).toBe('one');expect(plan.assignments.map(c=>c.after.id)).toEqual(['homework']);expect(plan.assignments[0].after.lessonId).toBe('');
  expect(plan.sessions[0].after).toEqual({...data.sessions[0],lessonId:'',title:lesson.title});
  expect(data).toEqual(before);expect(()=>lessonDeletionPlan(data,'missing')).toThrow('already been removed');
 });
 it('shows a separate delete action for each duplicate in a teacher week',()=>{
  const html=render(<WeeklyClass teacher/>);
  expect(html).toContain('Delete lesson: Paper discussion Part 1');expect(html).toContain('Delete lesson: Paper discussion Part I');
  expect((html.match(/>Delete lesson<\/button>/g)||[])).toHaveLength(2);
 });
 it('also exposes deletion in the lesson library and saved-lesson editor',()=>{
  expect(render(<TeacherRecords/>,true,'/teacher/lessons')).toContain('Delete lesson: Paper discussion Part 1');
  expect(render(<LessonEditor row={lesson} onClose={()=>{}}/>)).toContain('Delete lesson: Paper discussion Part 1');
  expect(render(<LessonEditor onClose={()=>{}}/>)).not.toContain('Delete lesson:');
 });
 it('keeps deletion controls away from students',()=>{
  expect(render(<DeleteLessonButton lesson={lesson}/>,false)).toBe('');
  expect(render(<DeleteLessonDialog lesson={lesson} onClose={()=>{}} onDeleted={()=>{}}/>,false)).toBe('');
  expect(render(<WeeklyClass/>,false,'/student/course/al?batch=a')).not.toContain('Delete lesson');
 });
 it('identifies the selected record, explains linked-record preservation, and supports safe nesting in the lesson editor',()=>{
  const html=render(<DeleteLessonDialog lesson={lesson} onClose={()=>{}} onDeleted={()=>{}}/>);
  expect(html).toContain('Lesson reference: one');expect(html).toContain('1 linked homework / quiz');expect(html).toContain('1 scheduled class');expect(html).toContain('Student submissions, marks, attendance and payments are preserved');expect(html).not.toContain('<form');
  expect(render(<DeleteLessonDialog lesson={{...lesson,batchId:''}} onClose={()=>{}} onDeleted={()=>{}}/>)).toContain('every batch that uses it');
 });
 it('keeps retained homework discoverable when its old lesson no longer exists',()=>{
  const html=render(<WeeklyClass/>,false,'/student/course/al?batch=a',data=>{data.lessons=data.lessons.filter(l=>l.id!=='one');});
  expect(html).toContain('Assignments &amp; activities');expect(html).toContain('Paper homework');expect(html).toContain('/student/assignments?assignment=homework');
 });
});
