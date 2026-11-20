import { describe, expect, it } from 'vitest';
import { registrationBatches, registrationComplete, validateRegistration } from '../src/student-registration';

const details = {displayName:' Student Name ',phone:'077 123 4567',age:18,preferredBatch:'27/A/L'};
describe('student registration', () => {
  it('accepts each offered batch and normalizes contact details', () => {
    const batches=[{id:'current',name:'Teacher-created 2027 batch',active:true},{id:'closed',name:'Old batch',active:false}];
    expect(registrationBatches(batches).map(b=>b.id)).toEqual(['current']);
    expect(validateRegistration({...details,preferredBatch:'Teacher-created 2027 batch',preferredBatchId:'current'})).toEqual({...details,displayName:'Student Name',phone:'0771234567',preferredBatch:'Teacher-created 2027 batch',preferredBatchId:'current'});
  });
  it('requires all four details', () => {
    for (const invalid of [{displayName:''},{phone:'hello'},{age:0},{age:18.5},{preferredBatch:''}]) expect(() => validateRegistration({...details,...invalid})).toThrow();
  });
  it('asks legacy accounts to complete their details without changing their records', () => {
    expect(registrationComplete()).toBe(false);
    expect(registrationComplete({id:'old',displayName:'Old Student',email:'test@example.com',phone:''})).toBe(false);
    expect(registrationComplete({id:'new',...details,registrationCompleted:true})).toBe(false);
    expect(registrationComplete({id:'new',...details,city:'Kandy',candidateType:'school',school:'Test School',registrationCompleted:true})).toBe(true);
    expect(registrationComplete({id:'incomplete',...details,age:0,registrationCompleted:true})).toBe(false);
  });
});
