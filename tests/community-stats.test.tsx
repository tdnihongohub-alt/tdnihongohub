import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppContext } from '../src/store';
import { initialData } from '../src/seed';
import { CommunityStatsEditor, HomeCommunity } from '../src/CommunityStats';
import { communityCountDefaults, communityCountRecord, communityCounts, validateCommunityCounts } from '../src/community-stats';
import type { Row } from '../src/domain';

function render(node:React.ReactNode,row?:Row,teacher=false){
 const data=initialData();if(row)data.settings.push(row);
 return renderToStaticMarkup(<AppContext.Provider value={{data,demo:true,identity:{teacher}} as any}><MemoryRouter>{node}</MemoryRouter></AppContext.Provider>);
}
describe('homepage community figures',()=>{
 it('starts with the supplied figures and does not combine overlapping communities',()=>{
  expect(communityCounts()).toEqual({youtube:1140,channel:1260,al2027:159,n4:150,n5:110,n3:65,al2028:40});
  const html=render(<HomeCommunity/>);
  for(const value of ['1,140','1,260','159','150','110','65','40'])expect(html).toContain(value);
  for(const label of ['YouTube subscribers','WhatsApp channel followers','2027 A/L squad','2028 A/L squad','N3 squad','N4 squad','N5 squad'])expect(html).toContain(label);
  expect(html).toContain('https://www.youtube.com/@TDNihongoHUB');expect(html).toContain('https://whatsapp.com/channel/0029VbD4Dhj3wtb8PDgkL60L');
  expect(html).toContain('Community snapshot');expect(html).not.toContain('Live subscribers');expect(html).not.toContain('Total students');
 });
 it('renders saved edits including zero, leaving unspecified fields at their defaults',()=>{
  const row={id:'communityStats',counts:{youtube:2200,channel:0,n3:80},updatedAt:'2026-11-19T05:00:00.000Z'};
  expect(communityCounts(row)).toMatchObject({youtube:2200,channel:0,n3:80,al2027:159});
  const html=render(<HomeCommunity/>,row);expect(html).toContain('2,200');expect(html).toContain('>0</strong>');expect(html).not.toContain('1,140');expect(html).toContain('Updated 19 Nov 2026');
 });
 it('saves a separate public settings record without changing brand or teaching records',()=>{
  const data=initialData(true),before=structuredClone(data);
  const next=communityCountRecord({...communityCountDefaults,youtube:2000,al2028:45},{id:'communityStats',customField:'keep'},'2026-11-19T05:00:00.000Z');
  expect(next).toEqual({id:'communityStats',counts:{...communityCountDefaults,youtube:2000,al2028:45},updatedAt:'2026-11-19T05:00:00.000Z',customField:'keep'});
  expect(data).toEqual(before);
 });
 it('rejects negative, fractional, empty and non-finite figures before saving',()=>{
  for(const youtube of [-1,1.2,'',NaN,Infinity,1_000_000_001])expect(()=>validateCommunityCounts({...communityCountDefaults,youtube})).toThrow('YouTube subscribers: enter a whole number');
  expect(validateCommunityCounts({...communityCountDefaults,youtube:0})).toMatchObject({youtube:0});
  expect(communityCounts({id:'communityStats',counts:{youtube:-5}}).youtube).toBe(1140);
 });
 it('provides seven editable count fields only to the teacher',()=>{
  const html=render(<CommunityStatsEditor/>,undefined,true);expect((html.match(/type="number"/g)||[]).length).toBe(7);expect(html).toContain('Save community counts');expect(html).toContain('not automatically fetched');
  expect(render(<CommunityStatsEditor/>)).toBe('');
 });
});
