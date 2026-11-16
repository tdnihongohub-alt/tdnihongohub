import { learningGuides } from './learning-guides';
export const siteOrigin='https://tdnihongohub.com';
export const publicPages:Record<string,{title:string;description:string}>={
 '/':{title:'Learn Japanese',description:'Learn Japanese with TD Nihongo HUB. Explore online classes, original learning guides, free lessons and guided practice.'},
 '/courses':{title:'Japanese classes',description:'Explore Japanese courses at TD Nihongo HUB. Find class information, study goals and teacher-approved enrolment.'},
 '/free-lessons':{title:'Free Japanese video lessons',description:'Watch public TD Nihongo HUB lessons in grammar, kanji, conversation, Japanese culture and exam preparation.'},
 '/learn':{title:'Japanese learning guides',description:'Read free Japanese guides with worked examples and practice answers. Study kana, introductions, particles and N5/N4 preparation.'},
 '/about':{title:'About TD Nihongo HUB',description:'Learn about the Japanese teaching approach at TD Nihongo HUB and explore live classes, recordings and guided practice.'},
 '/contact':{title:'Contact TD Nihongo HUB',description:'Contact TD Nihongo HUB for Japanese class enquiries, enrolment help, account support and learning-material corrections.'},
 '/privacy':{title:'Privacy Policy',description:'Read how TD Nihongo HUB handles account details, class records, learning activities, payments and third-party services.'},
 ...Object.fromEntries(learningGuides.map(g=>[`/learn/${g.slug}`,{title:g.title,description:g.description}])),
};
export function pageMetadata(path:string){
 const normalized=path==='/'?path:path.replace(/\/$/,'');
 const page=publicPages[normalized];
 const privatePage=/^\/(student|teacher|login)(\/|$)/.test(normalized);
 return {title:`${page?.title||(privatePage?'Learning workspace':'Page not found')} | TD Nihongo HUB`,description:page?.description||'Sign in to your TD Nihongo HUB learning workspace.',canonical:siteOrigin+(page?normalized:'/'),index:!!page};
}
