import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from './store';
import { configured } from './firebase';
import { subscribeAppearance } from './repository';
import { appearanceRecord, appearanceSeason, seasons } from './season-theme';
import type { Season } from './season-theme';
import type { Row } from './domain';
import { Panel } from './ui';

const SeasonContext=createContext<Season>('general');
export const useSeason=()=>useContext(SeasonContext);
export function SeasonTheme({children}:{children:ReactNode}){
 const {data,demo}=useApp();const [live,setLive]=useState<Row|null|undefined>();
 useEffect(()=>{setLive(undefined);if(demo||!configured)return;return subscribeAppearance(setLive,()=>setLive(undefined));},[demo]);
 const row=demo||live===undefined?data.settings.find(s=>s.id==='appearance'):live;
 const season=appearanceSeason(row);
 useEffect(()=>{document.documentElement.dataset.season=season;return()=>{delete document.documentElement.dataset.season;};},[season]);
 return <SeasonContext.Provider value={season}>{children}</SeasonContext.Provider>;
}
export function SeasonThemeEditor(){
 const {data,identity,save,notify}=useApp();const row=data.settings.find(s=>s.id==='appearance');
 const current=appearanceSeason(row);const [chosen,setChosen]=useState<Season>(current),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>setChosen(current),[current]);
 if(!identity?.teacher)return null;
 const selected=seasons.find(s=>s.id===chosen)!;
 return <Panel className="section-gap season-editor" title="Japan’s four seasons" description="Choose the website’s look. General keeps your original design. Your choice applies to the public site and both workspaces; personal dark mode remains available.">
  <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await save('settings',appearanceRecord(chosen,row));notify(`${selected.name} theme saved. The website has been updated.`);}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}>
   <fieldset className="season-options" disabled={busy}><legend>Website theme</legend>{seasons.map(s=><label key={s.id} className={`season-option ${s.id}`}><input type="radio" name="season" value={s.id} checked={chosen===s.id} onChange={()=>setChosen(s.id)}/><span className="season-swatch" aria-hidden="true"><i/>{s.jp}</span><strong>{s.name}</strong><small>{s.description}</small>{current===s.id&&<span className="season-current">Active theme</span>}</label>)}</fieldset>
   <div className={`season-preview ${chosen}`}><span lang="ja">{selected.jp}</span><div><strong>{selected.name} · TD Nihongo HUB</strong><p>{selected.description}</p><small>{chosen==='general'?'Restore the original design at any time.':'Includes matching page accents and seasonal movement in the homepage hero.'}</small></div></div>
   {error&&<p className="error" role="alert">{error}</p>}<div className="form-footer"><button type="button" className="button" disabled={busy} onClick={()=>setChosen('general')}>Choose General</button><button className="button primary" disabled={busy}>{busy?'Saving…':'Save website theme'}</button></div>
  </form>
 </Panel>;
}
