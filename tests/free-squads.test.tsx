import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { emptyData } from '../src/domain';
import { freeSquadRecords,openFreeCourse } from '../src/free-squads';
import { registrationComplete,validateRegistration } from '../src/student-registration';
import { registrationApproval } from '../src/registration-approval';
import { teachingModules } from '../src/weekly-learning';
import { FreeSquads } from '../src/FreeSquads';
import { AppContext } from '../src/store';
const profile={id:'u',displayName:'Learner',phone:'0771112222',age:17,preferredBatch:'N5 squad',preferredBatchId:'squad-n5-batch',registrationCompleted:true,city:'Galle',candidateType:'school',school:'Test School'};
describe('free squad onboarding',()=>{
 it('provides six separate free modules which require approval, preserving public free courses',()=>{
  expect(freeSquadRecords()).toHaveLength(6);expect(new Set(freeSquadRecords().map(s=>s.course.id)).size).toBe(6);
  for(const {course,batch} of freeSquadRecords()){expect(course.access).toBe('free');expect(openFreeCourse(course)).toBe(false);expect(batch.monthlyFee).toBe(0);}
  expect(openFreeCourse({id:'public',access:'free'})).toBe(true);
 });
 it('keeps the squads unavailable until approved and creates the student with demographics',()=>{
  const data=emptyData();for(const {course,batch} of freeSquadRecords()){data.courses.push(course);data.batches.push(batch);}data.users=[profile];
  expect(teachingModules(data,'','u')).toEqual([]);
  const changes=registrationApproval(data,'u','__new__',profile.preferredBatchId);
  for(const {table,row} of changes)data[table].push(row);
  expect(data.students[0]).toMatchObject({city:'Galle',school:'Test School',candidateType:'school'});
  expect(teachingModules(data,'STU-u','u').map(m=>m.title)).toEqual(['N5 squad']);
  expect(changes.some(c=>['payments','feeMonths'].includes(c.table))).toBe(false);
 });
 it('requires city and school for school students and clears school for private candidates',()=>{
  expect(registrationComplete(profile)).toBe(true);
  for(const invalid of [{city:''},{school:''},{candidateType:'invalid'}])expect(()=>validateRegistration({...profile,...invalid})).toThrow();
  expect(validateRegistration({...profile,candidateType:'private',school:'Old school'})).toMatchObject({city:'Galle',candidateType:'private',school:''});
 });
 it('renders join actions and saved community counts on all six squad cards',()=>{
  const data=emptyData();data.courses=freeSquadRecords().map(s=>s.course);data.settings=[{id:'communityStats',counts:{n5:115}}];
  const html=renderToStaticMarkup(<AppContext.Provider value={{data,demo:true} as any}><MemoryRouter><FreeSquads/></MemoryRouter></AppContext.Provider>);
  expect(html).toContain('115 community members');expect(html).toContain('O/L squad');expect(html).toContain('/courses/squad-n3');expect((html.match(/Request to join</g)||[])).toHaveLength(6);
 });
});
