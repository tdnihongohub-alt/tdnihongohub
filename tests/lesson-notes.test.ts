import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { lessonNote,noteVisible } from '../src/lesson-note';
import { lessonContentPlan } from '../src/lesson-content';
describe('typed lesson notes',()=>{
 const lesson={id:'lesson',title:'Kaiwa',courseId:'al',batchId:'',module:'Conversation',notes:'Old notes',recordingUrl:'',resourceUrl:'',published:true,visibility:'members'};
 it('stores scheduled notes separately from a published lesson and respects Sri Lanka release time',()=>{
  const note=lessonNote('lesson',['日本語','සිංහල'].join(String.fromCharCode(10,10)),'scheduled','2027-01-01T18:00');
  const changes=lessonContentPlan(emptyData(),lesson,undefined,note);
  expect(changes[0].row).toMatchObject({notes:'',hasManagedNotes:true,published:true});
  expect(changes[1]).toEqual({table:'lessonNotes',row:note});
  expect(noteVisible(note,Date.parse('2027-01-01T12:29:59Z'))).toBe(false);
  expect(noteVisible(note,Date.parse('2027-01-01T12:30:00Z'))).toBe(true);
 });
 it('keeps drafts hidden and preserves legacy notes when editing other lesson fields',()=>{
  expect(noteVisible(lessonNote('lesson','Draft','draft',''))).toBe(false);
  expect(lessonContentPlan(emptyData(),lesson)[0].row.notes).toBe('Old notes');
  expect(()=>lessonNote('lesson','Test','scheduled','2027-02-30T18:00')).toThrow('valid');
 });
});
