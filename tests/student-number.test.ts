import { afterEach,describe,expect,it,vi } from 'vitest';
import { emptyData } from '../src/domain';
import { studentOnboarded } from '../src/student-registration';
import { loginEmail,rememberStudentNumber,studentNumber } from '../src/student-number';

afterEach(()=>vi.unstubAllGlobals());

describe('student number and pending registration',()=>{
 it('keeps the sign-in number stable across teacher approval',async()=>{
  const id=await studentNumber('account-id');
  expect(id).toMatch(/^STU-[0-9A-F]{16}$/);
  expect(id).toBe(await studentNumber('account-id'));
  expect(id).not.toBe(await studentNumber('another-account'));
 });
 it('resolves the student number only on the browser that remembered it',()=>{
  const cache=new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>cache.get(key),setItem:(key:string,value:string)=>cache.set(key,value)});
  expect(()=>loginEmail('STU-1234')).toThrow('this browser');
  expect(rememberStudentNumber('STU-1234','student@example.test')).toBe(true);
  expect(loginEmail('stu-1234')).toBe('student@example.test');
  expect(loginEmail(' actual@example.test ')).toBe('actual@example.test');
 });
 it('accepts saved registration details before the teacher creates an enrolment',()=>{
  const data=emptyData();
  data.users=[{id:'pending',registrationCompleted:true},{id:'incomplete',registrationCompleted:false}];
  expect(studentOnboarded(data,'pending')).toBe(true);
  expect(studentOnboarded(data,'incomplete')).toBe(false);
 });
});
