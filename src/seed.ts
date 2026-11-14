import { brandDefaults, publicLessons } from './brand';
import { emptyData, today, monthNow, addDays } from './domain';
import type { Data } from './domain';
export function initialData(demo=false):Data {
 const d=emptyData();
 d.settings=[structuredClone(brandDefaults)];
 d.lessons=structuredClone(publicLessons);
 d.courses=[
 {id:'n5',title:'Japanese N5',category:'N5',description:'Build your foundation in Japanese, from hiragana and katakana to everyday vocabulary and grammar.',outcomes:'Read hiragana and katakana\nUnderstand everyday expressions\nBuild core grammar and vocabulary',access:'paid',monthlyFee:0,published:true,active:true,format:'Live Zoom classes + recordings'},
 {id:'n4',title:'Japanese N4',category:'N4',description:'Take the next step with Japanese grammar, reading and listening practice.',outcomes:'Extend your grammar knowledge\nPractise reading longer passages\nDevelop listening comprehension',access:'paid',monthlyFee:0,published:true,active:true,format:'Live Zoom classes + recordings'},
 {id:'al',title:'A/L Japanese',category:'A/L',description:'Structured Japanese language lessons and practice for A/L students.',outcomes:'Develop reading and writing\nPractise language skills\nWork through guided assignments',access:'paid',monthlyFee:0,published:true,active:true,format:'Live Zoom classes + recordings'},
 {id:'free',title:'Start your Japanese journey',category:'N5',description:'Learn with public lessons in Sinhala and Japanese: grammar, kanji, conversation, culture and exam practice.',outcomes:'Discover the language\nBuild a learning habit',access:'free',monthlyFee:0,published:true,active:true,format:'Free YouTube lessons'}];
 if(!demo)return d;
 d.courses.forEach(c=>{if(c.access==='paid')c.monthlyFee=2500;});
 d.users=[{id:'demo-student',displayName:'Demo Student',email:'student@example.test',phone:'0770000000'}];
 d.students=[{id:'STU-DEMO',fullName:'Demo Student',phone:'0770000000',email:'student@example.test',registeredOn:today(),active:true}];
 d.studentLinks=[{id:'demo-student',studentId:'STU-DEMO'}];
 d.batches=[{id:'BAT-DEMO',courseId:'n5',name:'N5 · Weekend group',capacity:25,monthlyFee:2500,startDate:today(),endDate:'',active:true}];
 d.enrollments=[{id:'STU-DEMO_BAT-DEMO',studentId:'STU-DEMO',batchId:'BAT-DEMO',courseId:'n5',status:'active',joinedOn:today()}];
 d.courseAccess=[{id:'STU-DEMO_n5',studentId:'STU-DEMO',courseId:'n5',active:true}];
 d.lessons=[{id:'LES-DEMO',courseId:'n5',title:'First steps: greetings',module:'01 · Getting started',notes:'こんにちは。Introduce yourself and practise a few everyday greetings.\n\nThis is sample lesson content for the preview.',recordingUrl:'',resourceUrl:'',published:true,visibility:'members'},...d.lessons];
 d.sessions=[{id:'SES-DEMO',courseId:'n5',batchId:'BAT-DEMO',lessonId:'LES-DEMO',date:today(),time:'18:00',duration:90,zoomUrl:'',status:'scheduled',seriesId:''}];
 d.assignments=[{id:'ASN-DEMO',courseId:'n5',lessonId:'LES-DEMO',title:'Introduce yourself in Japanese',instructions:'Write a short self-introduction using the greetings we practised. You can type your answer or share a link to your worksheet.',dueDate:addDays(today(),3),releaseAt:0,deadlineAt:Date.parse(addDays(today(),3)+'T23:59:00+05:30'),allowLate:true,kind:'assignment',formQuestions:[],worksheetUrl:'',maxMark:10,published:true}];
 d.questions=[{id:'Q-DEMO',courseId:'n5',topic:'Greetings',prompt:'Which expression means “good morning”?',options:['おはようございます','こんばんは','ありがとう','さようなら'],correct:0,explanation:'おはようございます is the polite morning greeting.',published:true}];
 d.feeMonths=[{id:`STU-DEMO_BAT-DEMO_${monthNow()}`,studentId:'STU-DEMO',batchId:'BAT-DEMO',month:monthNow(),amount:2500,dueDate:`${monthNow()}-10`}];
 d.announcements=[{id:'ANN-DEMO',batchId:'BAT-DEMO',courseId:'n5',title:'Welcome to your learning space',body:'Your class links, notes and homework are all together here.',createdAt:new Date().toISOString()}];
 d.tasks=[{id:'TSK-DEMO',title:'Prepare the next lesson worksheet',dueDate:today(),batchId:'BAT-DEMO',lessonId:'LES-DEMO',done:false}];
 return d;
}
