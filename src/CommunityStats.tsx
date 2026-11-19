import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Users, Youtube } from 'lucide-react';
import { useApp } from './store';
import { configured } from './firebase';
import { subscribeCommunityStats } from './repository';
import { brandDefaults } from './brand';
import { publicChannelLink, WhatsAppIcon } from './CommunityLinks';
import { communityCountFields, communityCountRecord, communityCounts } from './community-stats';
import type { Row } from './domain';
import { Form, Panel } from './ui';
import './community-stats.css';

export function HomeCommunity(){
 const {data,demo}=useApp();const saved=data.settings.find(s=>s.id==='communityStats');
 const [live,setLive]=useState<Row|null|undefined>(undefined);
 useEffect(()=>{setLive(undefined);if(demo||!configured)return;return subscribeCommunityStats(setLive,()=>setLive(undefined));},[demo]);
 const row=demo||live===undefined?saved:live;const counts=communityCounts(row);
 const brand={...brandDefaults,...data.settings.find(s=>s.id==='brand')};
 const youtube=publicChannelLink(brand.youtube,'youtube'),whatsapp=publicChannelLink(brand.whatsappChannel,'whatsapp');
 const updated=row?.updatedAt?new Date(row.updatedAt):undefined;
 const channels=[{key:'youtube' as const,label:'YouTube subscribers',action:'Watch & subscribe',href:youtube,icon:<Youtube size={23}/>},{key:'channel' as const,label:'WhatsApp channel followers',action:'Follow our channel',href:whatsapp,icon:<WhatsAppIcon size={23}/>}];
 return <section className="home-community-counts section container" aria-labelledby="community-counts-title">
  <div className="community-counts-heading"><div><span className="eyebrow">一緒に / OUR COMMUNITY</span><h2 id="community-counts-title">Learn with the squad.</h2></div><span className="community-counts-caption">A little Japanese. A growing community.</span></div>
  <div className="community-channel-counts">{channels.map(item=><article key={item.key} className={`community-count-card ${item.key}`}><div className="community-count-icon">{item.icon}</div><div><strong className="community-count-number">{counts[item.key].toLocaleString('en-US')}</strong><span className="community-count-label">{item.label}</span></div>{item.href&&<a href={item.href} target="_blank" rel="noopener noreferrer">{item.action}<ArrowUpRight size={16}/></a>}</article>)}</div>
  <div className="community-squad-counts" aria-label="Our learning squads">{communityCountFields.slice(2).map(({key,label},index)=><div key={key} className={`community-squad tone-${index}`}><Users size={17} aria-hidden="true"/><span>{label}</span><strong>{counts[key].toLocaleString('en-US')}</strong><small>members</small></div>)}</div>
  <div className="community-counts-footer"><span>Community snapshot{updated&&!Number.isNaN(updated.getTime())?` · Updated ${updated.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Colombo'})}`:''}</span><Link to="/free-lessons">Find your learning group<ArrowUpRight size={14}/></Link></div>
 </section>;
}

export function CommunityStatsEditor(){
 const {data,identity,save,notify}=useApp();const row=data.settings.find(s=>s.id==='communityStats');
 if(!identity?.teacher)return null;
 return <Panel className="section-gap community-counts-editor" title="Homepage community counts" description="Update your subscriber, follower and squad figures here. Saved changes appear on the homepage while visitors have it open.">
  <p className="form-note community-counts-editor-note">Enter the latest figures from YouTube and WhatsApp. These counts are maintained by you; they are not automatically fetched from those platforms.</p>
  <Form key={row?.updatedAt||'initial'} initial={communityCounts(row)} fields={communityCountFields.map(({key,label})=>({name:key,label,type:'number' as const,min:0,max:1_000_000_000,required:true}))} submit="Save community counts" onCancel={()=>{}} onSave={async values=>{
   await save('settings',communityCountRecord(values,row));notify('Community counts saved. The homepage has been updated.');
  }}/>
 </Panel>;
}
