import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData } from '../src/domain';
import { AppContext } from '../src/store';
import { Schedule, TimetableManager } from '../src/Timetable';
import { daysBetween, sameSession, sessionsInWeek, timetableChanges, validateTimetableChanges, validDate, weekStart } from '../src/timetable-management';
const first={id:'one',batchId:'a',courseId:'al',lessonId:'lesson',date:'2026-11-23',time:'18:00',duration:90,zoomUrl:'https://example.com/zoom',status:'scheduled',title:'Grammar',seriesId:'series',description:'Teacher-entered notes'};
const second={...first,id:'two',date:'2026-11-26',time:'20:00',title:'Reading'};
function render(node:React.ReactNode,student=false,path='/teacher/schedule?date=2026-11-23'){
 const data=emptyData();data.batches=[{id:'a',name:'2027 A/L Theory',courseId:'al',active:true}];data.courses=[{id:'al',title:'A/L Japanese'}];data.sessions=[first,second];
 data.courses.push({id:'n4',title:'Japanese N4'});
 data.batches.push({id:'b',name:'December N4',courseId:'n4',active:true});
 data.sessions.push({...first,id:'n4-class',title:'N4 class',batchId:'b',courseId:'n4'});
 data.practiceSeries=[{id:'theory',title:'Theory Kaiwa',batchId:'a',courseId:'al',startDate:'2026-11-26',endDate:'2027-12-31',time:'08:00',active:true,questionCount:1},{id:'n4',title:'N4 Kanji practice',batchId:'b',courseId:'n4',startDate:'2026-11-26',endDate:'2027-12-31',time:'08:00',active:true,questionCount:10}];
 data.students=[{id:'s',active:true}];data.courseAccess=[{id:'s_al',studentId:'s',courseId:'al',active:true,allModules:true}];
 const context={data,studentId:'s',identity:{uid:'u',verified:true,teacher:!student},batch:async()=>{},changeTimetable:async()=>{},notify:()=>{}} as any;
 return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AppContext.Provider>);
}
describe('weekly timetable management',()=>{
 it('selects exactly the displayed Monday–Sunday week and optional batch',()=>{
  const rows=[first,second,{...first,id:'before',date:'2026-11-22'},{...first,id:'after',date:'2026-11-30'},{...first,id:'other',batchId:'b'}];
  expect(weekStart('2026-11-29')).toBe('2026-11-23');
  expect(sessionsInWeek(rows,'2026-11-25','a').map(s=>s.id)).toEqual(['one','two']);
 });
 it('moves the whole selected week without changing times, IDs, notes or lesson links',()=>{
  const rows=[first,second],before=structuredClone(rows);
  const changes=timetableChanges(rows,{action:'move',firstDate:'2026-11-30'});
  expect(changes.map(c=>[c.after?.id,c.after?.date,c.after?.time])).toEqual([['one','2026-11-30','18:00'],['two','2026-12-03','20:00']]);
  expect(changes[0].after).toMatchObject({lessonId:'lesson',batchId:'a',seriesId:'series',description:first.description,zoomUrl:first.zoomUrl});
  expect(rows).toEqual(before);
 });
 it('supports earlier dates, year boundaries and setting one start time for all selected classes',()=>{
  const changes=timetableChanges([first,second],{action:'move',firstDate:'2026-12-31',time:'19:30'});
  expect(changes.map(c=>c.after?.date)).toEqual(['2026-12-31','2027-01-03']);
  expect(changes.every(c=>c.after?.time==='19:30')).toBe(true);
  expect(timetableChanges([second],{action:'move',firstDate:'2026-11-24'})[0].after?.date).toBe('2026-11-24');
 });
 it('deletes only the selected timetable entry and leaves the input records untouched',()=>{
  const before=structuredClone(first),changes=timetableChanges([first],{action:'delete'});
  expect(changes).toEqual([{before:first,after:null}]);expect(first).toEqual(before);
 });
 it('rejects impossible dates, no-op changes, duplicate selections and altered record IDs',()=>{
  expect(validDate('2026-02-30')).toBe(false);expect(daysBetween('2026-12-31','2027-01-01')).toBe(1);
  expect(()=>timetableChanges([first],{action:'move',firstDate:first.date})).toThrow('different');
  expect(()=>timetableChanges([first],{action:'move',firstDate:'2026-02-30'})).toThrow('valid date');
  expect(()=>timetableChanges([first,first],{action:'delete'})).toThrow('once');
  expect(()=>validateTimetableChanges([{before:first,after:{...first,id:'different'}}])).toThrow('original ID');
  expect(sameSession(first,{...first,time:'19:00'})).toBe(false);
 });
 it('shows weekly and individual teacher actions and uses the selected date for new classes',()=>{
  const html=render(<Schedule/>);expect(html).toContain('Reschedule week');expect(html).toContain('Manage / delete');expect(html).toContain('Delete session on 2026-11-23');
  const create=render(<Schedule/>,false,'/teacher/schedule?date=2026-12-01&batch=a&new=1');expect(create).toContain('value="2026-12-01"');expect(create).toContain('value="a" selected=""');expect(create).toContain('Repeat weekly until');
  const edit=render(<Schedule/>,false,'/teacher/schedule?edit=one');expect(edit).toContain('Delete scheduled class');expect(edit).toContain('Apply date shift');
 });
 it('isolates classes and practice by course and denies an unapproved student course URL',()=>{
  for(const student of [false,true]){
   const html=render(<Schedule student={student}/>,student,'/student/schedule?course=al&date=2026-11-23');
   expect(html).toContain('A/L Japanese timetable');
   expect(html).toContain('Grammar');
   expect(html).toContain('Theory Kaiwa');
   expect(html).not.toContain('N4 class');
   expect(html).not.toContain('N4 Kanji practice');
   expect(html).not.toContain('December N4');
  }
  expect(render(<Schedule student/>,true,'/student/schedule?course=n4')).toContain('This course timetable is unavailable');
 });
 it('keeps student timetables read-only and previews exactly which sessions will be deleted',()=>{
  const student=render(<Schedule student/>,true,'/student/schedule?date=2026-11-23');
  expect(student).not.toContain('Reschedule week');expect(student).not.toContain('Delete session');expect(student).not.toContain('Schedule class</button>');
  const deletion=render(<TimetableManager rows={[first,second]} action="delete" onClose={()=>{}}/>);
  expect(deletion).toContain('2 of 2 selected');expect(deletion).toContain('Will be deleted');expect(deletion).toContain('Delete 2 classes');expect(deletion).toContain('attendance, recordings and student records are retained');
 });
});
