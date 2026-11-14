import { afterEach, expect, it, vi } from 'vitest';
import { initialStudentTheme } from '../src/student-theme';

afterEach(() => vi.unstubAllGlobals());
function device(dark:boolean,saved:string|null=null){
 vi.stubGlobal('window',{matchMedia:()=>({matches:dark})});
 vi.stubGlobal('localStorage',{getItem:()=>saved});
}
it('uses the device preference on the first visit',()=>{device(true);expect(initialStudentTheme()).toBe('dark');device(false);expect(initialStudentTheme()).toBe('light');});
it('keeps a saved light preference on a dark device',()=>{device(true,'light');expect(initialStudentTheme()).toBe('light');});
it('keeps a saved dark preference on a light device',()=>{device(false,'dark');expect(initialStudentTheme()).toBe('dark');});
it('ignores an invalid saved preference',()=>{device(true,'invalid');expect(initialStudentTheme()).toBe('dark');});
it('works when browser storage is blocked',()=>{device(true);vi.stubGlobal('localStorage',{getItem:()=>{throw Error('Storage blocked');}});expect(initialStudentTheme()).toBe('dark');});
