import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData } from '../src/domain';
import { AppContext } from '../src/store';
import { WeeklyClass } from '../src/WeeklyClass';
import { RemoveRecordingButton, RemoveRecordingDialog } from '../src/RemoveRecordingButton';
import { isRecordingRemoved, recordingRemovalUpdates, sameRecordingSource } from '../src/recording-removal';
import { recordingThumbnail } from '../src/lesson-content';

const first={id:'one',courseId:'al',batchId:'a',title:'Lesson Part 1',recordingTitle:'First recording',weekNumber:3,module:'Papers',published:true,visibility:'members',recordingUrl:'https://youtu.be/abcdefghijk',thumbnailUrl:'https://example.com/first.jpg',recordingDescription:'First recording notes',notes:'Keep lesson notes',resourceUrl:'https://example.com/tute.pdf',quizId:'quiz',tutes:[]};
const second={...first,id:'two',title:'Lesson Part I',recordingTitle:'Other copy',recordingUrl:'https://youtu.be/12345678901',thumbnailUrl:'https://example.com/second.jpg'};
function fixture(){const data=emptyData();data.courses=[{id:'al',title:'A/L Japanese',category:'A/L',access:'paid',published:true}];data.batches=[{id:'a',courseId:'al',name:'2027 A/L Paper',active:true},{id:'b',courseId:'al',name:'Other batch',active:true}];data.students=[{id:'s',active:true}];data.enrollments=[{id:'s_a',studentId:'s',courseId:'al',batchId:'a',status:'active'},{id:'s_b',studentId:'s',courseId:'al',batchId:'b',status:'active'}];data.courseAccess=[{id:'s_al',studentId:'s',courseId:'al',active:true}];data.lessons=[first,second];data.assignments=[{id:'homework',title:'Keep this homework',courseId:'al',batchId:'a',lessonId:'one',kind:'assignment',published:true,releaseAt:0,deadlineAt:4102444800000}];return data;}
function render(node:React.ReactNode,teacher=true,prepare?:(data:ReturnType<typeof fixture>)=>void){const data=fixture();prepare?.(data);const context={data,identity:{uid:'u',teacher,verified:true},studentId:'s',save:async()=>{},batch:async()=>{},removeRecording:async()=>{},notify:()=>{}} as any;return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[`${teacher?'/teacher/modules':'/student/course'}/al?batch=a`]}><Routes><Route path="/teacher/modules/:id" element={node}/><Route path="/student/course/:id" element={node}/></Routes></MemoryRouter></AppContext.Provider>);}
describe('removing an accidental recording copy from a week',()=>{
 it('clears only video fields while retaining the lesson, tutes and quiz link',()=>{
  const before=structuredClone(first),updates=recordingRemovalUpdates(first,'a'),after={...first,...updates};
  expect(updates).toEqual({recordingUrl:'',thumbnailUrl:'',recordingTitle:'',recordingDescription:'',recordingState:'removed'});
  expect(after).toMatchObject({id:'one',weekNumber:3,notes:'Keep lesson notes',resourceUrl:first.resourceUrl,quizId:'quiz',published:true});expect(first).toEqual(before);expect(recordingThumbnail(after)).toBe('');
 });
 it.each([true,false])('removes just one recording row for teacher=%s and retains other weekly content',teacher=>{
  const html=render(<WeeklyClass teacher={teacher}/>,teacher,data=>{data.lessons[0]={...first,...recordingRemovalUpdates(first,'a')};});
  expect((html.match(/>Watch<\/button>/g)||[])).toHaveLength(1);expect(html).toContain('Other copy');expect(html).not.toContain('https://example.com/first.jpg');expect(html).toContain('https://example.com/second.jpg');expect(html).toContain('Keep this homework');expect(html).toContain('https://example.com/tute.pdf');
 });
 it('removes the video card completely instead of leaving a Coming soon placeholder',()=>{
  const html=render(<WeeklyClass/>,false,data=>{data.lessons=data.lessons.map(l=>({...l,...recordingRemovalUpdates(l,'a')}));});
  expect(html).not.toContain('weekly-recording-thumb');expect(html).not.toContain('>Watch</button>');expect(html).not.toContain('Recording coming soon');expect(html).toContain('Keep lesson notes');
 });
 it('shows the action beside recordings for teachers and keeps it away from students',()=>{
  const html=render(<WeeklyClass teacher/>);expect(html).toContain('Remove recording from week: First recording');expect(html).toContain('Remove recording from week: Other copy');
  expect(render(<RemoveRecordingButton lesson={first} batchId="a"/>,false)).toBe('');expect(render(<RemoveRecordingDialog lesson={first} batchId="a" onClose={()=>{}}/>,false)).toBe('');
  const dialog=render(<RemoveRecordingDialog lesson={first} batchId="a" onClose={()=>{}}/>);expect(dialog).toContain('Selected copy: one');expect(dialog).toContain('Remove from this week');expect(dialog).not.toContain('<form');
 });
 it('removes shared material from only the chosen batch and permits adding a new video later',()=>{
  const shared={...first,batchId:''},updates=recordingRemovalUpdates(shared,'a'),after={...shared,...updates};
  expect(updates).toEqual({recordingHiddenInBatches:['a']});expect(after.recordingUrl).toBe(first.recordingUrl);expect(isRecordingRemoved(after,'a')).toBe(true);expect(isRecordingRemoved(after,'b')).toBe(false);
  expect(isRecordingRemoved({...first,...recordingRemovalUpdates(first,'a'),recordingUrl:second.recordingUrl},'a')).toBe(false);
 });
 it('guards incorrect classes and source changes without treating note edits as video replacements',()=>{
  expect(()=>recordingRemovalUpdates(first,'b')).toThrow('different class');expect(sameRecordingSource(first,{...first,notes:'Edited notes'})).toBe(true);expect(sameRecordingSource(first,{...first,recordingUrl:second.recordingUrl})).toBe(false);
 });
});
