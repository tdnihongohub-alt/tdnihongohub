export const brandDefaults={
 id:'brand',name:'TD Nihongo HUB',teacherName:'TD Nihongo Hub',
 tagline:'Let’s learn, practise, and grow together.',
 bio:'TD Nihongo Hub helps learners build their Japanese step by step, from Hiragana, Katakana and basic grammar to JLPT preparation. Explore vocabulary and kanji, listening, reading and speaking practice, and the culture behind the language. Join our online N5, N4 and A/L classes, or start with public lessons on YouTube.',
 greeting:'TD Nihongo HUB වෙත සාදරයෙන් පිළිගනිමු!',
 youtube:'https://www.youtube.com/@TDNihongoHUB',youtubeChannelId:'UCGrer8ECZqSsCnSpw6hYaqg',
 phone:'070 366 6043',phoneInternational:'+94703666043',whatsapp:'',whatsappChannel:'https://whatsapp.com/channel/0029VbD4Dhj3wtb8PDgkL60L',
 logoUrl:'/brand/td-nihongo-hub-logo.jpg',categories:['N5','N4','A/L','Other'],
};

// Curated public recordings from the channel’s Videos page, checked 11 November 2026.
export const publicLessons=[
 {id:'YT-cJzMuyOrRog',title:'JLPT N5 Paper Discussion · ප්‍රශ්න 120ක්',level:'N5',module:'Exam practice',recordingUrl:'https://www.youtube.com/watch?v=cJzMuyOrRog',notes:'Work through an N5 practice paper with TD Nihongo Hub. Public YouTube recording.',durationLabel:'2:04:07'},
 {id:'YT-IQOAVyIkV9Y',title:'N4 Grammar · ජපන් Grammar ප්‍රශ්න 70ක්',level:'N4',module:'Grammar practice',recordingUrl:'https://www.youtube.com/watch?v=IQOAVyIkV9Y',notes:'Practise N4 grammar questions with explanations from TD Nihongo Hub.',durationLabel:'1:41:35'},
 {id:'YT-faeAVGr1jFk',title:'はる (Haru) · Spring in Japan',level:'A/L',module:'Japanese culture',recordingUrl:'https://www.youtube.com/watch?v=faeAVGr1jFk',notes:'Learn about spring in Japan in this public Japanese culture lesson for A/L learners.',durationLabel:'29:54'},
 {id:'YT-3UP8DcZWNVY',title:'2027 A/L Japanese Theory · Grade 12 Revision, Part 1',level:'A/L',module:'A/L revision',recordingUrl:'https://www.youtube.com/watch?v=3UP8DcZWNVY',notes:'A public Grade 12 Japanese theory and revision lesson from TD Nihongo Hub.',durationLabel:'49:04'},
 {id:'YT-UcjUEXioCkM',title:'第14課 · 山・川・海・花・光 · Kanji practice',level:'Other',module:'Kanji and vocabulary',recordingUrl:'https://www.youtube.com/watch?v=UcjUEXioCkM',notes:'Study kanji and vocabulary through the channel’s Lesson 14 recording.',durationLabel:'1:14:51'},
 {id:'YT-42xHQhq_zKg',title:'カフェで ちゅうもんする · Ordering at a café',level:'Other',module:'Conversation practice',recordingUrl:'https://www.youtube.com/watch?v=42xHQhq_zKg',notes:'Practise Japanese conversation for ordering at a café.',durationLabel:'15:12'},
].map(l=>({...l,courseId:'free',published:true,visibility:'public',resourceUrl:''}));

export function logoSource(value?:string){return value?.startsWith('/brand/')?value:value&&/^https?:\/\//.test(value)?value:brandDefaults.logoUrl;}
