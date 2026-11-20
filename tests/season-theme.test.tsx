import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { appearanceSeason,appearanceRecord,seasons } from '../src/season-theme';
import { SeasonThemeEditor } from '../src/SeasonTheme';
import { AppContext } from '../src/store';
import { emptyData } from '../src/domain';
describe('admin seasonal themes',()=>{
 it('keeps the original look as General for new and invalid settings',()=>{
  expect(appearanceSeason()).toBe('general');expect(appearanceSeason({id:'appearance',season:'unknown'})).toBe('general');
  expect(appearanceRecord('general').generalTheme).toBe('original-pink-white-v1');
 });
 it('saves only the appearance record and accepts all four seasons and General',()=>{
  const previous={id:'appearance',season:'general',customSetting:'keep'};const before=structuredClone(previous);
  for(const s of seasons){const row=appearanceRecord(s.id,previous);expect(row).toMatchObject({id:'appearance',season:s.id,customSetting:'keep'});expect(appearanceSeason(row)).toBe(s.id);}
  expect(previous).toEqual(before);expect(()=>appearanceRecord('automatic')).toThrow('Choose General');
 });
 it('provides five options with the saved one selected and restore control for the admin only',()=>{
  const data=emptyData();data.settings=[{id:'appearance',season:'winter'}];
  const render=(teacher:boolean)=>renderToStaticMarkup(<AppContext.Provider value={{data,identity:{teacher}} as any}><SeasonThemeEditor/></AppContext.Provider>);
  const html=render(true);expect((html.match(/type="radio"/g)||[])).toHaveLength(5);
  expect(html).toContain('checked="" value="winter"');expect(html).toContain('Choose General');expect(html).toContain('Save website theme');expect(html).toContain('personal dark mode remains available');
  expect(render(false)).toBe('');
 });
});
