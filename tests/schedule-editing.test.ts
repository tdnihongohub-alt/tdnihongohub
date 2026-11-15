import { describe, it, expect } from 'vitest';
import { initialData } from '../src/seed';
import { sessionChanges } from '../src/schedule-editing';

describe('editing saved sessions',()=>{
 it('updates a saved session with the same ID and preserves unedited fields',()=>{
  const data=initialData(true);const row={...data.sessions[0],description:'Existing teacher notes',seriesId:'series'};
  const next=sessionChanges(data,{...row,time:'19:30',duration:60},row,false);
  expect(next).toEqual([{table:'sessions',row:{...row,time:'19:30',duration:60}}]);
  expect(data.sessions[0].time).toBe('18:00');
 });
 it('can edit a saved session whose batch has since been deactivated',()=>{
  const data=initialData(true);data.batches[0].active=false;
  const row=data.sessions[0];
  expect(sessionChanges(data,{...row,title:'Updated title'},row,false)[0].row.id).toBe(row.id);
  expect(()=>sessionChanges(data,{...row},undefined,false)).toThrow('active batch');
 });
 it('updates selected and future sessions without altering earlier or unrelated sessions',()=>{
  const data=initialData(true);const row={...data.sessions[0],date:'2026-11-15',seriesId:'series'};
  data.sessions=[row,{...row,id:'older',date:'2026-11-08'},{...row,id:'future',date:'2026-11-22',title:'Keep future title'},{...row,id:'other',seriesId:'other'}];
  const changes=sessionChanges(data,{...row,time:'20:00',title:'Updated selected title'},row,true);
  expect(changes.map(c=>c.row.id)).toEqual([row.id,'future']);
  expect(changes[0].row.title).toBe('Updated selected title');
  expect(changes[1].row.title).toBe('Keep future title');
  expect(changes[1].row.time).toBe('20:00');
 });
});
