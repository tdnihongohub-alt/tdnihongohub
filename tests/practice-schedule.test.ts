import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { practiceSeriesRecord,practiceSlots,practiceStatus,practiceTemplate } from '../src/practice-schedule';

describe('recurring timetable practice',()=>{
 const data=emptyData();
 data.batches=[{id:'kanji',active:true,courseId:'theory'}];
 const series=practiceSeriesRecord(data,{batchId:'kanji',title:'Kanji practice',startDate:'2026-11-27',endDate:'2027-12-31',time:'08:00',questionCount:10,kind:'form'},'friday');
 it('preserves the same Friday when switching calendar views and includes the final Friday',()=>{
  const year=practiceSlots([series],[],'2026-11-23','2028-01-02');
  expect(year[0].date).toBe('2026-11-27');
  expect(year.at(-1)?.date).toBe('2027-12-31');
  expect(year).toHaveLength(58);
  expect(practiceSlots([series],[],'2027-12-31','2027-12-31')[0].id).toBe(year.at(-1)?.id);
 });
 it('sets a stable slot ID and only opens a published activity at its Sri Lanka release time',()=>{
  const [slot]=practiceSlots([series],[],'2026-11-23','2026-11-29');
  expect(practiceStatus(slot)).toBe('Questions needed');
  const assignment=practiceTemplate(slot);
  expect(assignment).toMatchObject({id:slot.id,courseId:'theory',batchId:'kanji',expectedQuestionCount:10});
  const release=Date.parse('2026-11-27T02:30:00Z');
  expect(assignment.releaseAt).toBe(release);
  const [prepared]=practiceSlots([series],[assignment],'2026-11-27','2026-11-27');
  expect(practiceStatus(prepared,release-1)).toBe('Scheduled');
  expect(practiceStatus(prepared,release)).toBe('Available');
 });
});
