import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { learningTasks,taskDone } from '../src/learning-tasks';
import { redoDraft } from '../src/redo-submission';
import { validateSchedule } from '../src/assignment-scheduling';
describe('published learning activities',()=>{
 function fixture(){
  const data=emptyData();
  data.students=[{id:'s',active:true}];data.courseAccess=[{id:'s_c',studentId:'s',courseId:'c',active:true,allModules:true}];
  data.batches=[{id:'m',courseId:'c',active:true}];
  data.lessons=[{id:'l',courseId:'c',batchId:'m',title:'Reading',published:true,recordingUrl:'https://youtu.be/abcdefghijk',tutes:[{id:'t',title:'Worksheet',url:'https://example.com'}],notes:''}];
  data.assignments=[{id:'a',courseId:'c',batchId:'m',title:'Answer',published:true,releaseAt:0,lessonId:'l'},{id:'draft',courseId:'c',batchId:'m',title:'Draft',published:false},{id:'future',courseId:'c',batchId:'m',title:'Later',published:true,releaseAt:999999}];
  return data;
 }
 it('only counts released materials, recordings and assignments, with separate completion per task',()=>{
  const data=fixture(),tasks=learningTasks(data,'c','m','s',false,100);
  expect(tasks.map(t=>t.id)).toEqual(['recording:l','material:l:t','assignment:a']);
  data.progress=[{id:'old',uid:'u',lessonId:'l',complete:true}];
  data.taskProgress=[{id:'u_m_recording:l',uid:'u',taskId:'recording:l',batchId:'m',complete:false}];
  expect(taskDone(data,'u','s',tasks[0])).toBe(false);
  expect(taskDone(data,'u','s',tasks[1])).toBe(true);
  expect(taskDone(data,'other','s',tasks[1])).toBe(false);
 });
 it('supports practice without a deadline and hides draft notes inside a published lesson',()=>{
  const data=fixture();Object.assign(data.lessons[0],{hasManagedNotes:true,notesPublished:false});
  expect(learningTasks(data,'c','m','s',false,100).some(t=>t.kind==='notes')).toBe(false);
  expect(()=>validateSchedule({id:'a',releaseAt:0,deadlineAt:0,kind:'assignment'})).not.toThrow();
 });
 it('creates a clean redo attempt without mutating the reviewed answer or its feedback',()=>{
  const original={id:'s_a',status:'reviewed',answer:'Original',fileUrl:'',feedback:'Keep practising',mark:8,history:[],formAnswers:{q:'Old'}};
  const before=structuredClone(original),next=redoDraft(original,{id:'a',allowRedo:true});
  expect(original).toEqual(before);
  expect(next).toMatchObject({status:'draft',answer:'',formAnswers:{},mark:'',feedback:'',history:[{status:'redo'}]});
  expect(()=>redoDraft(original,{id:'a',allowRedo:false})).toThrow('not open');
 });
});

