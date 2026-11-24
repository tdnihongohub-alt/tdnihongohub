import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { registrationApproval } from '../src/registration-approval';
import { AppContext } from '../src/store';
import { WeeklyClass } from '../src/WeeklyClass';
import { LessonMedia } from '../src/LessonMedia';
import { ModuleCards } from '../src/TeachingModules';
import { moduleLessons, noticeRead, noticeVersion, studentNotices, teachingModules, weekGroups } from '../src/weekly-learning';
function fixture(){const data=emptyData();data.courses=[{id:'al',title:'A/L Japanese',category:'A/L',access:'paid',published:true,active:true}];data.students=[{id:'s',active:true}];data.batches=[{id:'a',name:'2027 A/L Theory',courseId:'al',active:true},{id:'b',name:'2028 A/L Theory',courseId:'al',active:true},{id:'c',name:'Private batch',courseId:'al',active:true}];data.enrollments=[{id:'s_a',studentId:'s',batchId:'a',courseId:'al',status:'active'},{id:'s_b',studentId:'s',batchId:'b',courseId:'al',status:'active'}];data.courseAccess=[{id:'s_al',studentId:'s',courseId:'al',active:true}];data.lessons=[{id:'l1',title:'Particles',module:'Grammar',courseId:'al',batchId:'a',weekNumber:1,notes:'Your lesson notes',recordingUrl:'',published:true,tutes:[{id:'t',title:'Grammar tute',url:'https://example.com/tute.pdf'}]},{id:'hidden',title:'Other batch secret',courseId:'al',batchId:'c',weekNumber:1,published:true}];data.announcements=[{id:'notice',courseId:'al',batchId:'a',title:'Class notice',body:'Please bring your worksheet.'}];data.sessions=[{id:'session',batchId:'a',courseId:'al',date:'2099-01-01',time:'18:00',duration:90,status:'scheduled'}];return data;}
function render(page:React.ReactNode,teacher=false,path='/student/course/al?batch=a',prepare?:(data:ReturnType<typeof fixture>)=>void){const data=fixture();prepare?.(data);const context={data,identity:{uid:'u',teacher,verified:true},studentId:'s',batch:async()=>{},save:async()=>{},notify:()=>{}} as any;return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={page}/><Route path="/student/course/:id" element={page}/><Route path="/teacher/modules/:id" element={page}/></Routes></MemoryRouter></AppContext.Provider>);}
describe('weekly class folders',()=>{
 it('shows every teacher module and only a student’s own active class folders',()=>{const data=fixture();expect(teachingModules(data,'s','u').map(m=>m.title)).toEqual(['2027 A/L Theory','2028 A/L Theory']);expect(teachingModules(data,'s','u',true)).toHaveLength(3);const courses=render(<ModuleCards/>);expect(courses).toContain('A/L Japanese');expect(courses).not.toContain('2027 A/L Theory');const html=render(<ModuleCards courseId="al"/>);expect(html).toContain('2027 A/L Theory');expect(html).not.toContain('2028 A/L Theory');expect(html).not.toContain('Private batch');});
 it('opens all active modules with a single course enrolment and closes them when paused',()=>{
  const approve=(data:ReturnType<typeof fixture>)=>{data.enrollments=[];data.courseAccess[0].allModules=true;};
  const granted=render(<WeeklyClass/>,false,'/student/course/al',approve);
  expect(granted).not.toContain('Private batch');
  const paused=render(<WeeklyClass/>,false,'/student/course/al?batch=c',data=>{approve(data);data.courseAccess[0].active=false;});
  expect(paused).toContain('needs teacher approval');
 });
 it('approves one course grant without creating module enrollments or monthly fee records',()=>{
  const data=fixture();
  data.users=[{id:'new',displayName:'New Student',phone:'0771234567',registrationCompleted:true,preferredCourseId:'al'}];
  const plan=registrationApproval(data,'new','__new__','al',true);
  expect(plan.find(c=>c.table==='courseAccess')?.row).toMatchObject({studentId:'STU-new',courseId:'al',active:true,allModules:true});
  expect(plan.some(c=>['enrollments','feeMonths','payments'].includes(c.table))).toBe(false);
 });
 it('keeps legacy lessons separate from explicitly numbered weeks without changing records',()=>{const lessons=[{id:'new',title:'Third',weekNumber:3},{id:'old-a',title:'First'},{id:'old-b',title:'Second'}];const before=structuredClone(lessons);const groups=weekGroups(lessons);expect(groups.map(g=>[g.number,g.lessons[0].id])).toEqual([[1,'old-a'],[2,'old-b'],[3,'new']]);expect(lessons).toEqual(before);});
 it('shows topics and categories independently from weeks and keeps lesson progress',()=>{
  const data=fixture();
  const groups=weekGroups([{id:'week',title:'Weekly',weekNumber:1},{id:'topic',title:'Essay',weekNumber:1,sectionType:'topic'}]);
  expect(groups).toHaveLength(2);expect(groups.map(g=>g.label)).toEqual(['Week','Topic']);
  const html=render(<WeeklyClass/>,false,undefined,data=>{data.lessons[0].sectionType='topic';data.progress=[{id:'done',uid:'u',lessonId:data.lessons[0].id,complete:true}];});
  expect(html).toContain('Topic 1: Particles');expect(html).toContain('Complete all tasks in Topic');
  expect(html).toContain('Your learning progress');expect(html).not.toContain('Week 1: Particles');
 });
 it('groups multiple recordings into a week and includes shared materials without another batch',()=>{const data=fixture();data.lessons.push({...data.lessons[0],id:'l2'},{id:'shared',courseId:'al',batchId:'',title:'Shared',published:true});const lessons=moduleLessons(data,'al','a','s');expect(lessons.map(l=>l.id)).not.toContain('hidden');expect(lessons.map(l=>l.id)).toContain('shared');expect(weekGroups(lessons)[0].lessons).toHaveLength(2);});
 it('renders weekly resources, notifications and a personal progress tick',()=>{const html=render(<WeeklyClass/>);for(const label of ['2027 A/L Theory','Weekly lessons','Assignments &amp; homework','Quizzes','Tutes','Lesson recordings','Announcements','Class schedule','Grammar tute','Complete all tasks in Week'])expect(html).toContain(label);expect(html).toContain('aria-label="Learning progress"');expect(html).not.toContain('Other batch secret');expect(html).not.toContain('One lesson at a time');});
 it('protects a guessed batch URL and preserves previously saved completion',()=>{expect(render(<WeeklyClass/>,false,'/student/course/al?batch=c')).toContain('This class needs teacher approval');const html=render(<WeeklyClass/>,false,undefined,data=>{data.progress=[{id:'u_l1',uid:'u',lessonId:'l1',courseId:'al',complete:true}];});expect(html).toContain('value="2" max="2"');expect(html).toContain('checked=""');});
 it('keeps existing lesson links inside the correct enrolled batch',()=>{const html=render(<WeeklyClass/>,false,'/student/course/al?lesson=second-batch',data=>{data.lessons.push({id:'second-batch',title:'Reading practice',courseId:'al',batchId:'b',weekNumber:2,published:true,notes:'Read the passage'});});expect(html).toContain('2028 A/L Theory</h1>');expect(html).toContain('Week 2: Reading practice');expect(html).not.toContain('Week 1: Particles');expect(render(<WeeklyClass/>,false,'/student/course/al?lesson=hidden')).toContain('This class needs teacher approval');});
 it('provides teacher week tools and class-scoped scheduling',()=>{const html=render(<WeeklyClass teacher/>,true,'/teacher/modules/al?batch=a&tab=schedule');expect(html).toContain('Add week');expect(html).toContain('/teacher/schedule?new=1&amp;batch=a');expect(html).not.toContain('I have completed Week');});
 it('previews recordings for the teacher without student progress controls',()=>{const lesson=fixture().lessons[0];expect(render(<LessonMedia lesson={lesson} preview/>,true)).not.toContain('Mark recording complete');expect(render(<LessonMedia lesson={lesson}/>)).toContain('Mark recording complete');});
 it('keeps attendance accessible and limited to the current student',()=>{const html=render(<WeeklyClass/>,false,'/student/course/al?batch=a&tab=attendance',data=>{data.attendance=[{id:'own',studentId:'s',batchId:'a',date:'2026-11-18',status:'Present'},{id:'other',studentId:'someone-else',batchId:'a',date:'2026-11-18',status:'Absent'}];});expect(html).toContain('My attendance');expect(html).toContain('Present');expect(html).not.toContain('>Absent<');});
});
describe('persistent unread class updates',()=>{
 it('remembers reading on any device and reflags an edited announcement',()=>{const data=fixture(),notice=data.announcements[0];expect(noticeRead(data,'u',notice,'announcement')).toBe(false);data.contentReads=[{id:'u_announcement_notice',uid:'u',kind:'announcement',recordId:notice.id,version:noticeVersion(notice,'announcement')}];expect(noticeRead(data,'u',notice,'announcement')).toBe(true);expect(noticeRead(data,'other',notice,'announcement')).toBe(false);expect(noticeRead(data,'u',{...notice,body:'The class time has changed.'},'announcement')).toBe(false);});
 it('does not alert for another student’s class or past timetable entries',()=>{const data=fixture();data.announcements.push({id:'private',batchId:'c'});data.sessions.push({id:'old',batchId:'a',date:'2020-01-01'});expect(studentNotices(data,'s').map(n=>n.row.id)).toEqual(['notice','session']);});
});
