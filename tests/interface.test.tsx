import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppContext } from '../src/store';
import { initialData } from '../src/seed';
import { Home, Courses, CourseDetail, FreeLessons, About, Login, CommunityPage } from '../src/Public';
import { TeacherHome, TeacherRecords, AccessRequests, Submissions } from '../src/Teacher';
import { Attendance, BrandSettings, Payments, Schedule, Students } from '../src/Administration';
import { StudentHome, MyClasses, LearningClass, StudentAssignments, StudentPayments } from '../src/Student';
import { CheckLevel, MonthlyQuiz, MonthlyHistory } from '../src/CheckLevel';
import { Workspace } from '../src/Workspace';
import { StudentRegistration } from '../src/StudentRegistration';
import { AssignmentEditor } from '../src/AssignmentEditor';

function render(node:React.ReactNode,path='/',pattern='*',sample=true,prepare?:(data:ReturnType<typeof initialData>)=>void){
 const data=initialData(sample);
 prepare?.(data);
 const identity={uid:'demo-student',displayName:'Demo Student',email:'student@example.test',verified:true,teacher:true};
 const context={data,identity,studentId:'STU-DEMO',demo:true,loading:false,error:'',notify:()=>{},save:async()=>{},remove:async()=>{},refresh:async()=>{},batch:async()=>{},approve:async()=>{},enroll:async()=>{},acceptRegistration:async()=>{},deleteStudent:async()=>{},login:async()=>{},google:async()=>{},reset:async()=>{},verify:async()=>{},logout:async()=>{},startDemo:()=>{},exitDemo:()=>{}};
 return renderToString(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={node}/></Routes></MemoryRouter></AppContext.Provider>);
}
describe('public website',()=>{
 it('links community from the main navigation and keeps the community figures accessible',()=>{
  const html=render(<CommunityPage/>,'/community');
  const nav=html.slice(html.indexOf('<nav id="public-navigation"'),html.indexOf('</nav>'));
  expect(nav).toContain('href="/community"');expect(nav).toContain('Our community');
  expect(nav).not.toContain('href="/about"');expect(nav).not.toContain('href="/contact"');
  expect(html).toContain('Learn with the squad.');expect(html).toContain('1,140');expect(html).toContain('1,260');
 });
 it('keeps privacy in the footer and shows a labelled sign-out action',()=>{const html=render(<Home/>);expect(html).toContain('public-sign-out');expect(html).toContain('>Sign out</button>');expect((html.match(/Privacy Policy/g)||[]).length).toBe(1);expect(html.indexOf('Privacy Policy')).toBeGreaterThan(html.indexOf('<footer'));});
 it('keeps the homepage focused on classes, free recordings and the community',()=>{const html=render(<Home/>);expect(html).toContain('Explore all classes');expect(html).toContain('JLPT N5 Paper Discussion');expect(html).toContain('Learn with the squad.');expect(html).toContain('YouTube subscribers');expect(html).toContain('Choosing a Japanese exam?');for(const removed of ['Make a little progress today.','WHAT YOU GET WITH TD NIHONGO HUB','Illustrative portal preview','Save a course or request access','A FEW HELPFUL ANSWERS'])expect(html).not.toContain(removed);expect(html).toContain('href="/learn"');expect(html).not.toContain('Guaranteed results');});
 it('renders the brand and class promotion without invented claims',()=>{const html=render(<Home/>);expect(html).toContain('TD NIHONGO');expect(html).toContain('Find your class');expect(html).toContain('Learn Japanese.');expect(html).toContain('日本語を、あなたの力に。');expect(html).toContain('Pause petals');expect(html).toContain('Live Zoom classes');expect(html).not.toContain('100% pass');});
 it('renders courses and course-specific details',()=>{expect(render(<Courses/>)).toContain('Japanese N5');expect(render(<CourseDetail/>,'/courses/n5','/courses/:id')).toContain('What you');});
 it('provides the channel link when recordings have not been supplied',()=>{expect(render(<FreeLessons/>)).toContain('https://www.youtube.com/@TDNihongoHUB');});
 it('renders the verified public phone without assuming WhatsApp access',()=>{const html=render(<About contact/>);expect(html).toContain('YouTube channel');expect(html).toContain('tel:+94703666043');expect(html).toContain('070 366 6043');expect(html).not.toContain('wa.me/');});
});
describe('teacher interface',()=>{
 it('offers batch assignment targeting and visible payment edit/delete controls',()=>{
  const work=render(<AssignmentEditor row={{id:'a',courseId:'n5',batchId:'BAT-DEMO'}} onClose={()=>{}}/>);
  expect(work).toContain('Assign to batch');expect(work).toContain('N5 · Weekend group');expect(work).toContain('only with its actively enrolled students');
  const payments=render(<Payments/>,'/teacher/payments?view=history','*',true,data=>{data.payments=[{id:'p',studentId:'STU-DEMO',batchId:'BAT-DEMO',month:'2026-11',amount:1000,paidOn:'2026-11-17',method:'Cash',status:'confirmed'}];});
  expect(payments).toContain('aria-label="Edit payment"');expect(payments).toContain('>Delete</button>');
 });
 it('exposes saved timetable editing and student registration approval',()=>{
   expect(render(<Schedule/>)).toContain('aria-label="Edit session"');
   const edit=render(<Schedule/>,'/teacher/schedule?edit=SES-DEMO');
   expect(edit).toContain('Edit scheduled class');expect(edit).toContain('Save session changes');expect(edit).toContain('value="18:00"');
   const html=render(<Students/>,'/teacher/students','*',true,data=>{data.users[0]={...data.users[0],age:18,preferredBatch:'N5',registrationCompleted:true};data.studentLinks=[];});
   expect(html).toContain('Review &amp; accept');expect(html).toContain('Pending');expect(html).toContain('>Delete</button>');
 });
 it('renders the action queue and financial follow-ups',()=>{const html=render(<TeacherHome/>);expect(html).toContain('Needs your attention');expect(html).toContain('Outstanding fees');});
 it('renders course, batch, lesson and assignment tables',()=>{expect(render(<TeacherRecords/>,'/teacher/classes')).toContain('Courses');expect(render(<TeacherRecords/>,'/teacher/classes?view=batches')).toContain('N5 · Weekend group');expect(render(<TeacherRecords/>,'/teacher/lessons')).toContain('First steps');expect(render(<TeacherRecords/>,'/teacher/lessons?view=assignments')).toContain('Introduce yourself');});
 it('renders records, schedule, attendance, fees and brand forms',()=>{expect(render(<Students/>)).toContain('Demo Student');expect(render(<Schedule/>)).toContain('Your timetable');expect(render(<Attendance/>)).toContain('Mark attendance');expect(render(<Payments/>)).toContain('Fee snapshot');expect(render(<BrandSettings/>)).toContain('WhatsApp');});
 it('opens creation forms directly from teacher quick-action links',()=>{expect(render(<Students/>,'/teacher/students?new=1')).toContain('Full name');expect(render(<TeacherRecords/>,'/teacher/lessons?new=1')).toContain('Lesson title');expect(render(<Schedule/>,'/teacher/schedule?new=1')).toContain('Duration (minutes)');expect(render(<Payments/>,'/teacher/payments?new=1')).toContain('Amount received (LKR)');});
 it('provides the native form editor and scheduling fields',()=>{const html=render(<TeacherRecords/>,'/teacher/lessons?view=assignments&new=1');expect(html).toContain('Interactive form / quiz');expect(html).toContain('Release at (Sri Lanka time)');expect(html).toContain('Deadline (Sri Lanka time)');expect(html).toContain('Allow submissions after the deadline');});
 it('renders review queues and copyable reminder tools',()=>{expect(render(<AccessRequests/>)).toContain('No requests waiting');expect(render(<Submissions/>)).toContain('No homework submitted');expect(render(<TeacherRecords table="tasks"/>)).toContain('Copy message');});
});
describe('student interface',()=>{
 it('offers student details with batches from the teacher records',()=>{const html=render(<StudentRegistration/>);for(const label of ['Full name','Phone number','Age','N5 · Weekend group','Complete registration'])expect(html).toContain(label);expect(html).toContain('value="BAT-DEMO"');expect(html).not.toContain('28/O/L');expect(html).not.toContain('name="email"');});
 it('shows a full sign-out button in both workspace sidebars',()=>{for(const teacher of [false,true]){const html=render(<Workspace teacher={teacher}/>);expect(html).toContain('workspace-sign-out');expect(html).toContain('>Sign out</button>');expect(html).not.toContain('Privacy Policy');}});
 it('offers the monthly collection and links it from the student dashboard',()=>{const html=render(<CheckLevel/>);expect(html).toContain('November 2026');expect(html).toContain('Coming soon');expect((html.match(/Start quiz/g)||[]).length).toBe(9);expect(html).toContain('repeat attempts do not add duplicate points');expect(render(<StudentHome/>)).toContain('Check your level');});
 it('renders every reviewed quiz without revealing answers before submission',()=>{for(const id of ['AL-B01','AL-I01','AL-H01','N5-B01','N5-I01','N5-H01','N4-B01','N4-I01','N4-H01']){const html=render(<MonthlyQuiz/>,`/student/check-level/${id}`,'/student/check-level/:quizId');expect((html.match(/class="quiz-question level-question"/g)||[]).length).toBe(3);expect(html).toContain('Submit quiz');expect(html).not.toContain('Understand the other choices');}expect(render(<MonthlyQuiz/>,'/student/check-level/N5-B01','/student/check-level/:quizId')).toContain('<strong>山</strong>');expect(render(<MonthlyQuiz/>,'/student/check-level/missing','/student/check-level/:quizId')).toContain('Quiz not found');expect(render(<MonthlyHistory/>)).toContain('Your completed monthly quizzes');});
 it('gives a new learner real free content without invented class progress',()=>{const html=render(<StudentHome/>,'/student','*',false);expect(html).toContain('A fresh beginning.');expect(html).toContain('Explore free lessons');expect(html).toContain('JLPT N5 Paper Discussion');expect(html).toContain('Reveal meaning');expect(html).not.toContain('NaN');expect(html).not.toContain('First steps: greetings');});
 it('renders student learning, classes and lesson notes',()=>{expect(render(<StudentHome/>)).toContain('Welcome back');expect(render(<MyClasses/>)).toContain('Japanese N5');expect(render(<LearningClass/>,'/student/course/n5','/student/course/:id')).toContain('Recording coming soon');});
 it('renders assignments and separated payment claims',()=>{expect(render(<StudentAssignments/>)).toContain('Introduce yourself in Japanese');expect(render(<StudentPayments/>)).toContain('Your payment claims');});
 it('does not render access to an unapproved paid class',()=>{expect(render(<LearningClass/>,'/student/course/n4','/student/course/:id')).toContain('needs teacher approval');});
});
