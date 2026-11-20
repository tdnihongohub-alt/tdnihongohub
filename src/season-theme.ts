import type { Row } from './domain';
export const seasons=[
 {id:'general',name:'General',jp:'いつもの',description:'Your current pink-and-white design, preserved.',color:'#ad477b',wash:'#fff3f8',motion:'petals',particle:'#efb4b0'},
 {id:'spring',name:'Spring',jp:'春',description:'Sakura pink, blossom cream and drifting petals.',color:'#a33167',wash:'#ffeef3',motion:'petals',particle:'#f1a7c1'},
 {id:'summer',name:'Summer',jp:'夏',description:'Fresh green, clear teal and leaves in the breeze.',color:'#176b5b',wash:'#eaf6ef',motion:'leaves',particle:'#76ab76'},
 {id:'autumn',name:'Autumn',jp:'秋',description:'Maple red, warm amber and falling maple leaves.',color:'#a04221',wash:'#fff0df',motion:'leaves',particle:'#d47434'},
 {id:'winter',name:'Winter',jp:'冬',description:'Ice blue, soft white and gentle falling snow.',color:'#32628c',wash:'#edf4fd',motion:'snow',particle:'#d5e9fc'},
] as const;
export type Season=typeof seasons[number]['id'];
export function validSeason(value:unknown):value is Season{return seasons.some(s=>s.id===value);}
export function appearanceSeason(row?:Row|null):Season{return validSeason(row?.season)?row.season:'general';}
export function appearanceRecord(season:unknown,previous?:Row):Row{
 if(!validSeason(season))throw Error('Choose General, Spring, Summer, Autumn or Winter.');
 return {...previous,id:'appearance',season,generalTheme:'original-pink-white-v1',updatedAt:new Date().toISOString()};
}
