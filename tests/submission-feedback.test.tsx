import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData, validate } from '../src/domain';
import { ScheduledWork } from '../src/ScheduledWork';
import { AppContext } from '../src/store';

const original={id:'s_work',studentId:'s',assignmentId:'work',courseId:'al',answer:'My Japanese answer',fileUrl:'',formAnswers:{q:'やま'},status:'submitted',submittedAt:'2026-11-18T12:00:00.000Z',history:[]};

describe('teacher feedback and another attempt',()=>{
 it.each(['reviewed','returned'])('saves %s feedback and marks without losing the original answers',status=>{
  const before=structuredClone(original);
  const feedback={status,feedback:'Review the particles and try again.',mark:6,at:'2026-11-18T13:00:00.000Z'};
  const saved=validate('submissions',{...original,...feedback,history:[...original.history,feedback],reviewedAt:feedback.at});
  expect(saved).toMatchObject({status,mark:6,feedback:feedback.feedback,answer:original.answer,formAnswers:original.formAnswers,studentId:'s',assignmentId:'work',submittedAt:original.submittedAt,history:[feedback]});
  expect(original).toEqual(before);
 });
 it('keeps draft and submitted states valid, preserves zero marks, and rejects unknown states',()=>{
  for(const status of ['draft','submitted','reviewed','returned'])expect(validate('submissions',{...original,status,mark:0}).mark).toBe(0);
  expect(()=>validate('submissions',{...original,status:'approved'})).toThrow();
 });
 it.each(['returned','reviewed'])('shows %s feedback to the student with the correct editing state',status=>{
  const data=emptyData();
  data.students=[{id:'s',active:true}];data.enrollments=[{id:'s_batch',studentId:'s',courseId:'al',batchId:'batch',status:'active'}];
  data.assignments=[{id:'work',courseId:'al',batchId:'batch',title:'Japanese homework',kind:'assignment',instructions:'Write a sentence.',maxMark:10,published:true,releaseAt:0,deadlineAt:4102444800000,allowLate:true}];
  data.submissions=[validate('submissions',{...original,status,feedback:'Check your particles.',mark:6})];
  const context={data,studentId:'s',identity:{uid:'u',teacher:false,verified:true},save:async()=>{},notify:()=>{}} as any;
  const html=renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={['/student/assignments?assignment=work']}><ScheduledWork/></MemoryRouter></AppContext.Provider>);
  expect(html).toContain('Check your particles.');expect(html).toContain('6 / 10');expect(html).toContain('My Japanese answer');
  if(status==='returned'){expect(html).toContain('Your answer');expect(html).toContain('Save draft');expect(html).toContain('Submit to teacher');}
  else{expect(html).toContain('Your submission');expect(html).not.toContain('Submit to teacher');}
 });
});
