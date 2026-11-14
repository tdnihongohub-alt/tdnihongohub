import { describe, expect, it } from 'vitest';
import { assignmentReleased, assignmentClosed, assignmentDeadline, parseSriLanka, sriLankaInput, validateSchedule, validateFormAnswers } from '../src/assignment-scheduling';
import type { FormQuestion } from '../src/assignment-scheduling';
const release=parseSriLanka('2026-11-14T18:00'),deadline=parseSriLanka('2026-11-15T20:30');
const work={id:'a',published:true,releaseAt:release,deadlineAt:deadline,allowLate:false};
describe('scheduled assignments and custom forms',()=>{
 it('uses Sri Lanka time independently of the computer timezone',()=>{expect(new Date(release).toISOString()).toBe('2026-11-14T12:30:00.000Z');expect(sriLankaInput(deadline)).toBe('2026-11-15T20:30');});
 it('hides drafts and scheduled content until release',()=>{expect(assignmentReleased(work,release-1)).toBe(false);expect(assignmentReleased(work,release)).toBe(true);expect(assignmentReleased({...work,published:false},deadline)).toBe(false);});
 it('closes at the deadline unless late responses are allowed',()=>{expect(assignmentClosed(work,deadline)).toBe(false);expect(assignmentClosed(work,deadline+1)).toBe(true);expect(assignmentClosed({...work,allowLate:true},deadline+1)).toBe(false);});
 it('retains the deadline of older assignments',()=>{expect(new Date(assignmentDeadline({id:'old',dueDate:'2026-11-14'})).toISOString()).toBe('2026-11-14T18:29:59.000Z');expect(assignmentReleased({id:'old',published:true},release)).toBe(true);});
 it('rejects deadlines before release',()=>{expect(()=>validateSchedule({...work,deadlineAt:release-1})).toThrow('after');});
 it('checks required and permitted answers for native form questions',()=>{const qs:FormQuestion[]=[{id:'name',label:'Name',type:'short',required:true,options:[]},{id:'level',label:'Level',type:'choice',required:true,options:['N5','N4']},{id:'topics',label:'Topics',type:'checkbox',required:false,options:['Kanji','Grammar']}];expect(()=>validateFormAnswers(qs,{name:'',level:'N5'})).toThrow('Name');expect(()=>validateFormAnswers(qs,{name:'Learner',level:'N3'})).toThrow('Level');expect(()=>validateFormAnswers(qs,{name:'Learner',level:'N4',topics:['Kanji']})).not.toThrow();});
 it('rejects empty forms and duplicate choice options',()=>{expect(()=>validateSchedule({...work,kind:'form',formQuestions:[]})).toThrow();expect(()=>validateSchedule({...work,kind:'form',formQuestions:[{id:'q',label:'Pick',type:'choice',options:['A','A']}]})).toThrow('different');});
});
