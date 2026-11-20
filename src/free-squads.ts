import type { Row } from './domain';
export const freeSquads=[
 {key:'ol',title:'O/L squad',category:'O/L'},
 {key:'al2028',title:'2028 A/L squad',category:'A/L'},
 {key:'al2027',title:'2027 A/L squad',category:'A/L'},
 {key:'n4',title:'N4 squad',category:'N4'},
 {key:'n3',title:'N3 squad',category:'N3'},
 {key:'n5',title:'N5 squad',category:'N5'},
];
export const openFreeCourse=(c:Row)=>c.access==='free'&&!c.approvalRequired;
export function freeSquadRecords(){return freeSquads.map(s=>({
 course:{id:`squad-${s.key}`,title:s.title,category:s.category,description:`Join the free ${s.title} for weekly Japanese learning materials and practice. Everyone can request to join. Your teacher confirms access.`,access:'free',approvalRequired:true,squadKey:s.key,monthlyFee:0,published:true,active:true,format:'Free weekly learning module',outcomes:'Learn with your squad\nPractise Japanese\nFollow weekly materials'},
 batch:{id:`squad-${s.key}-batch`,courseId:`squad-${s.key}`,name:s.title,capacity:100000,monthlyFee:0,startDate:'2026-11-20',endDate:'',active:true,squadKey:s.key}
}));}
