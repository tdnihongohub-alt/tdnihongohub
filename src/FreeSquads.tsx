import { Link } from 'react-router-dom';
import { ArrowUpRight, Users } from 'lucide-react';
import { useApp } from './store';
import { useCommunityCounts } from './CommunityStats';
import { freeSquads } from './free-squads';

export function FreeSquads(){
 const {data}=useApp();const {counts}=useCommunityCounts();
 const courses=data.courses.filter(c=>c.published&&c.active&&c.squadKey).sort((a,b)=>freeSquads.findIndex(s=>s.key===a.squadKey)-freeSquads.findIndex(s=>s.key===b.squadKey));
 if(!courses.length)return null;
 return <section className="free-squads" aria-labelledby="free-squads-title"><div className="section-heading"><div><span className="eyebrow">FREE MODULES · EVERYONE IS WELCOME</span><h2 id="free-squads-title">Find your squad.</h2><p>Request to join. Your teacher will confirm your place.</p></div></div><div className="course-grid">{courses.map(c=>{
  const count=counts[c.squadKey as keyof typeof counts];
  return <article className="panel" key={c.id}><div className="pad"><span className="eyebrow">FREE · {c.category}</span><h3>{c.title}</h3><p><Users size={16}/> {count?`${count.toLocaleString('en-US')} community members`:'Open to new members'}</p><p>Weekly lessons, recordings and practice in one module.</p><Link className="button primary" to={`/courses/${c.id}`}>Request to join<ArrowUpRight size={16}/></Link></div></article>;
 })}</div></section>;
}
