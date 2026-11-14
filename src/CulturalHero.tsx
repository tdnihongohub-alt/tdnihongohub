import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight, Flower2, Mountain, Sparkles, Video, Play, ClipboardCheck, BrainCircuit, TrendingUp } from 'lucide-react';

const details=[
 {id:'sakura',name:'Sakura',jp:'桜',icon:Flower2,description:'Cherry blossoms mark the arrival of spring — a beautiful symbol of a fresh beginning.'},
 {id:'torii',name:'Torii',jp:'鳥居',icon:ArrowUpRight,description:'A torii is a traditional gateway that marks the entrance to a Shinto shrine.'},
 {id:'fuji',name:'Mount Fuji',jp:'富士山',icon:Mountain,description:'Mount Fuji is Japan’s highest mountain and a familiar subject in Japanese art.'},
];
export function CulturalHero(){
 const [selected,setSelected]=useState('sakura');
 const active=details.find(d=>d.id===selected)!;
 return <div className="culture-hero guided-culture-hero">
  <div className="culture-heading"><span>YOUR JAPANESE LEARNING JOURNEY</span><span lang="ja">日本語教室</span></div>
  <div className="culture-image-frame">
   <img className="culture-image" src="/images/japanese-culture-pointing-v2.webp" alt="Illustrated woman in an ivory floral kimono holding a study book and pointing toward live classes, recordings, and practice cards, with cherry blossoms and Mount Fuji behind her." width="1448" height="1086" fetchPriority="high"/>
   <div className="culture-vignette"/>
   <div className="culture-side-caption" aria-hidden="true">学ぶ、そして出会う。</div>

  </div>
  <nav className="hero-feature-cards" aria-label="What you can learn here">
   <span className="hero-feature-label">YOUR LEARNING TOOLKIT</span>
   <Link className="feature-live" to="/courses"><span className="hero-feature-icon"><Video size={17}/></span><span><strong>Live Japanese classes</strong><small>N5 · N4 · A/L on Zoom</small></span><ArrowUpRight size={13}/></Link>
   <Link className="feature-recordings" to="/free-lessons"><span className="hero-feature-icon"><Play size={17}/></span><span><strong>Watch & revise</strong><small>Recordings at your pace</small></span><ArrowUpRight size={13}/></Link>
   <Link className="feature-quizzes" to="/student/check-level"><span className="hero-feature-icon"><BrainCircuit size={17}/></span><span><strong>Build your Japanese</strong><small>Test your knowledge with quizzes</small></span><ArrowUpRight size={13}/></Link>
   <Link className="feature-progress" to="/student/marks?view=practice"><span className="hero-feature-icon"><TrendingUp size={17}/></span><span><strong>Check your progress</strong><small>See your marks & practice points</small></span><ArrowUpRight size={13}/></Link>
   <Link className="feature-homework" to="/student/assignments"><span className="hero-feature-icon"><ClipboardCheck size={17}/></span><span><strong>Learn with feedback</strong><small>Homework & guidance from your teacher</small></span><ArrowUpRight size={13}/></Link>
  </nav>
  <div className="culture-discovery"><div className="discovery-title"><Sparkles size={13}/><span>A LANGUAGE. A CULTURE. A NEW PERSPECTIVE.</span></div><div className="culture-tabs" role="group" aria-label="Discover Japanese culture">{details.map(d=><button key={d.id} className={d.id===selected?'active':''} aria-pressed={d.id===selected} aria-controls="culture-description" onClick={()=>setSelected(d.id)}><d.icon size={13}/><span>{d.name}</span><small>{d.jp}</small></button>)}</div><p id="culture-description" aria-live="polite">{active.description}</p></div>
 </div>;
}
