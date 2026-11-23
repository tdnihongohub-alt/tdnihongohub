import { timetableHomework } from '../src/timetable-homework';
import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { practiceSeriesRecord,practiceSlots,practiceStatus,practiceTemplate } from '../src/practice-schedule';

describe('recurring timetable practice',()=>{
 const data=emptyData();
 data.batches=[{id:'kanji',active:true,courseId:'theory'}];
 const series=practiceSeriesRecord(data,{batchId:'kanji',title:'Kanji practice',startDate:'2026-11-27',endDate:'2027-12-31',time:'08:00',questionCount:10,kind:'form'},'friday');
 it('schedules a required typed response without creating a live class',()=>{
  const {series:item,assignment}=timetableHomework(data,'homework',{batchId:'kanji',title:'Kaiwa Question',question:'日本語で答えてください。',date:'2028-01-06',time:'18:00',deadline:'2028-01-07T18:00'});
  expect(practiceSlots([item],[assignment],'2028-01-01','2028-01-31')).toHaveLength(1);
  expect(assignment).toMatchObject({kind:'assignment',responseMode:'questions',autoGrade:false,batchId:'kanji',courseId:'theory',formQuestions:[{type:'long',required:true,label:'日本語で答えてください。'}]});
  expect(assignment.releaseAt).toBe(Date.parse('2028-01-06T12:30:00Z'));
 });
 it('preserves the same Friday when switching calendar views and includes the final Friday',()=>{
  const year=practiceSlots([series],[],'2026-11-23','2028-01-02');
  expect(year[0].date).toBe('2026-11-27');
  expect(year.at(-1)?.date).toBe('2027-12-31');
  expect(year).toHaveLength(58);
  expect(practiceSlots([series],[],'2027-12-31','2027-12-31')[0].id).toBe(year.at(-1)?.id);
 });
 it('supports one-time, daily, selected weekdays, and monthly schedules',()=>{
  const dates=(settings:Record<string,unknown>)=>practiceSlots([practiceSeriesRecord(data,{...series,startDate:'2028-01-31',endDate:'2028-03-31',...settings},'repeat')],[],'2028-01-01','2028-03-31').map(slot=>slot.date);
  expect(dates({frequency:'once',endDate:''})).toEqual(['2028-01-31']);
  expect(dates({frequency:'daily',endDate:'2028-02-02'})).toEqual(['2028-01-31','2028-02-01','2028-02-02']);
  expect(dates({frequency:'weekly',weekdays:[2,4],endDate:'2028-02-04'})).toEqual(['2028-02-01','2028-02-03']);
  expect(dates({frequency:'monthly'})).toEqual(['2028-01-31','2028-03-31']);
 });
 it('keeps a saved assignment on its date after the repeat pattern changes',()=>{
  const [slot]=practiceSlots([series],[],'2026-11-27','2026-11-27');
  const assignment=practiceTemplate(slot);
  const updated={...series,frequency:'weekly',weekdays:[1]};
  expect(practiceSlots([updated],[assignment],'2026-11-27','2026-11-27')[0].assignment).toBe(assignment);
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
