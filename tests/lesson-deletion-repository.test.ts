import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({records:new Map<string,Record<string,any>>(),events:[] as string[],set:vi.fn(),update:vi.fn(),remove:vi.fn(),relink:false}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({
 doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`,id}),collection:(_db:unknown,table:string)=>({table}),where:(field:string,_op:string,value:any)=>({field,value}),query:(collection:any,...filters:any[])=>({...collection,filters}),
 getDocs:async(q:any)=>{const docs=[...mock.records.entries()].filter(([path,row])=>path.startsWith(q.table+'/')&&q.filters.every((f:any)=>row[f.field]===f.value)).map(([path,value])=>({id:path.split('/').pop(),data:()=>value}));if(mock.relink&&q.table==='assignments')mock.records.set('assignments/homework',{...mock.records.get('assignments/homework'),lessonId:'duplicate'});return {docs};},
 runTransaction:async(_db:unknown,run:(tx:any)=>Promise<void>)=>run({get:async(ref:any)=>{mock.events.push('read '+ref.path);const value=mock.records.get(ref.path);return {id:ref.id,exists:()=>!!value,data:()=>value};},set:mock.set,update:mock.update,delete:mock.remove}),
 getDoc:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn(),writeBatch:vi.fn(),onSnapshot:vi.fn()
}));
import { deleteLesson } from '../src/repository';
const lesson={id:'one',courseId:'al',batchId:'a',title:'Paper discussion',notes:'Keep this in the audit copy',weekNumber:3,published:true,recordingUrl:'https://youtu.be/abcdefghijk'};
describe('audited lesson deletion',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.events.length=0;mock.records.clear();mock.relink=false;const {id,...values}=lesson;mock.records.set('lessons/one',values);mock.records.set('lessons/duplicate',{...values,title:'Other copy'});mock.records.set('assignments/homework',{lessonId:'one',title:'Homework',published:true});mock.records.set('sessions/meeting',{lessonId:'one',title:'',date:'2026-11-20',time:'18:00',zoomUrl:'https://example.com/meeting'});mock.records.set('settings/learningRevision',{revision:'old'});});
 it('deletes only the selected lesson, detaches links and commits a private backup plus live-update signal',async()=>{
  await deleteLesson(lesson,'teacher');
  expect(mock.remove).toHaveBeenCalledExactlyOnceWith({path:'lessons/one',id:'one'});
  expect(mock.update).toHaveBeenCalledWith({path:'assignments/homework',id:'homework'},{lessonId:''});
  expect(mock.update).toHaveBeenCalledWith({path:'sessions/meeting',id:'meeting'},{lessonId:'',title:'Paper discussion'});
  const audit=mock.set.mock.calls.find(c=>c[0].path.startsWith('audit/'));
  expect(audit?.[1]).toMatchObject({action:'lesson_deleted',recordId:'one',before:lesson,actor:'teacher',detachedAssignments:['homework'],retainedSessions:['meeting']});
  expect(mock.set.mock.calls.filter(c=>c[0].path==='settings/learningRevision')).toHaveLength(1);
  const writes=[...mock.set.mock.calls,...mock.update.mock.calls,...mock.remove.mock.calls].map(c=>c[0].path);
  expect(writes.some(p=>/^(students|payments|feeMonths|attendance|submissions|progress)\//.test(p))).toBe(false);
  expect(mock.events[0]).toBe('read settings/learningRevision');
 });
 it('rejects a lesson edited after the deletion dialog was opened without writing anything',async()=>{
  mock.records.set('lessons/one',{...mock.records.get('lessons/one'),title:'Updated lesson'});
  await expect(deleteLesson(lesson,'teacher')).rejects.toThrow('has changed');expect(mock.remove).not.toHaveBeenCalled();expect(mock.update).not.toHaveBeenCalled();expect(mock.set).not.toHaveBeenCalled();
 });
 it('does not detach a homework record that has already been linked to another lesson',async()=>{
  mock.relink=true;await deleteLesson(lesson,'teacher');expect(mock.update.mock.calls.some(c=>c[0].path==='assignments/homework')).toBe(false);
 });
 it('rejects repeated deletion without creating an extra audit copy',async()=>{
  mock.records.delete('lessons/one');await expect(deleteLesson(lesson,'teacher')).rejects.toThrow('already been removed');expect(mock.remove).not.toHaveBeenCalled();expect(mock.set).not.toHaveBeenCalled();
 });
});
