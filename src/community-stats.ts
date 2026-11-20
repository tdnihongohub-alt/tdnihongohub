import type { Row } from './domain';

export const communityCountDefaults={youtube:1140,channel:1260,al2027:159,n4:150,n5:110,n3:65,al2028:40,ol:0};
export type CommunityCountKey=keyof typeof communityCountDefaults;
export const communityCountFields:{key:CommunityCountKey;label:string}[]=[
 {key:'youtube',label:'YouTube subscribers'},
 {key:'channel',label:'WhatsApp channel followers'},
 {key:'al2027',label:'2027 A/L squad'},
 {key:'n4',label:'N4 squad'},
 {key:'n5',label:'N5 squad'},
 {key:'n3',label:'N3 squad'},
 {key:'al2028',label:'2028 A/L squad'},
 {key:'ol',label:'O/L squad'},
];
const validCount=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=1_000_000_000;
export function communityCounts(row?:Row|null){
 return Object.fromEntries(communityCountFields.map(({key})=>[key,validCount(row?.counts?.[key])?row!.counts[key]:communityCountDefaults[key]])) as typeof communityCountDefaults;
}
export function validateCommunityCounts(values:Record<string,unknown>){
 for(const {key,label} of communityCountFields)if(!validCount(values[key]))throw Error(`${label}: enter a whole number between 0 and 1,000,000,000.`);
 return Object.fromEntries(communityCountFields.map(({key})=>[key,values[key]])) as typeof communityCountDefaults;
}
export function communityCountRecord(values:Record<string,unknown>,previous?:Row,updatedAt=new Date().toISOString()):Row{
 return {...previous,id:'communityStats',counts:validateCommunityCounts(values),updatedAt};
}
