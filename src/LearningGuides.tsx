import { useParams } from 'react-router-dom';
import { PublicLayout } from './Public';
import { learningGuides } from './learning-guides';
import { GuideArticle, GuideCards } from './GuideContent';
import './learning-guides.css';

export function LearningGuides(){return <PublicLayout><main className="container section public-restyle guides-page"><header className="public-page-head"><div className="eyebrow">LEARN AT YOUR OWN PACE</div><h1>Japanese learning guides</h1><p>Short explanations, worked examples and practice you can use before your next lesson.</p></header><GuideCards/></main></PublicLayout>;}
export function LearningGuide(){const {slug}=useParams();const guide=learningGuides.find(g=>g.slug===slug);return <PublicLayout><main className="container section public-restyle guides-page">{guide?<GuideArticle guide={guide}/>:<div className="empty"><h1>Guide not found</h1><a href="/learn">Browse learning guides</a></div>}</main></PublicLayout>;}
export function HomeGuides(){return <section className="section container home-guides"><div className="section-heading"><div><div className="eyebrow">READ · TRY · UNDERSTAND</div><h2>Make a little progress today.</h2></div><a className="text-link" href="/learn">All learning guides →</a></div><GuideCards/></section>;}
