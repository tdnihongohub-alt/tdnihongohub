import { describe, expect, it } from 'vitest';
import { addDays, csv, feeBalance, monthsBetween, percent, recurringSessions, safeLink, validate, youtubeId } from '../src/domain';

describe('fee snapshots and receipt allocation',()=>{
 const fee={id:'fee',studentId:'s1',batchId:'b1',month:'2026-10',amount:2500};
 it('retains an earlier unpaid month independently of current payments',()=>{expect(feeBalance(fee,[{id:'p',studentId:'s1',batchId:'b1',month:'2026-11',amount:2500}]).pending).toBe(2500);});
 it('adds part payments for exactly one student, batch and month',()=>{const payments=[{id:'p1',studentId:'s1',batchId:'b1',month:'2026-10',amount:1000},{id:'p2',studentId:'s1',batchId:'b1',month:'2026-10',amount:500},{id:'p3',studentId:'s2',batchId:'b1',month:'2026-10',amount:2500}];expect(feeBalance(fee,payments)).toEqual({paid:1500,pending:1000,status:'Partially paid'});});
 it('does not count voided payments',()=>{expect(feeBalance(fee,[{id:'p',studentId:'s1',batchId:'b1',month:'2026-10',amount:2500,status:'void'}]).status).toBe('Pending');});
 it('uses the saved fee snapshot when course prices later change',()=>{expect(feeBalance(fee,[{id:'p',studentId:'s1',batchId:'b1',month:'2026-10',amount:2500}])).toEqual({paid:2500,pending:0,status:'Paid'});expect(fee.amount).toBe(2500);});
});
describe('scheduling and attendance',()=>{
 it('creates a weekly series across a month boundary',()=>{expect(recurringSessions({id:'s',date:'2026-10-27',time:'18:00'},'2026-11-12').map(s=>s.date)).toEqual(['2026-10-27','2026-11-03','2026-11-10']);});
 it('rejects a backwards recurrence range',()=>{expect(()=>recurringSessions({id:'s',date:'2026-11-10'},'2026-11-09')).toThrow();});
 it('moves through year boundaries',()=>{expect(addDays('2026-12-31',1)).toBe('2027-01-01');expect(monthsBetween('2026-11','2027-02')).toEqual(['2026-11','2026-12','2027-01','2027-02']);});
 it('counts Late as attended and handles empty records',()=>{expect(percent([{id:'a',status:'Present'},{id:'b',status:'Late'},{id:'c',status:'Absent'}])).toBe(67);expect(percent([])).toBe(0);});
});
describe('links, validation and exports',()=>{
 it('recognizes only real YouTube hosts and valid video identifiers',()=>{expect(youtubeId('https://youtu.be/abcdefghijk')).toBe('abcdefghijk');expect(youtubeId('https://www.youtube.com/watch?v=abcdefghijk')).toBe('abcdefghijk');expect(youtubeId('https://evil.test/watch?v=abcdefghijk')).toBeNull();expect(youtubeId('https://youtube.com/watch?v=invalid')).toBeNull();});
 it('rejects executable external links',()=>{expect(safeLink('javascript:alert(1)')).toBe('');expect(safeLink('data:text/html,hello')).toBe('');expect(safeLink('https://example.com/worksheet')).toBeTruthy();});
 it('escapes formulas, quotes and multiline CSV values',()=>{const text=csv([{name:'=CMD()',note:'a,"b"\nc'}]);expect(text).toContain("'=CMD()");expect(text).toContain('"a,""b""\nc"');});
 it('rejects negative fee values and malformed quiz answer sets',()=>{expect(()=>validate('courses',{title:'N5',category:'N5',description:'Japanese',access:'paid',monthlyFee:-1,published:true,active:true})).toThrow();expect(()=>validate('questions',{courseId:'n5',topic:'Greetings',prompt:'Question',options:['A','B'],correct:0,explanation:'',published:true})).toThrow();});
 it('rejects non-web receipt links',()=>{expect(()=>validate('paymentClaims',{amount:100,month:'2026-11',paidOn:'2026-11-10',reference:'ABC',receiptUrl:'javascript:bad()',batchId:'b'})).toThrow();});
});
