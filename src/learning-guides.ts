export type Guide = {
  slug:string; title:string; description:string; topic:string;
  sections:{title:string; paragraphs:string[]; examples?:{jp:string;reading:string;meaning:string}[]}[];
  practice:{prompt:string;answer:string}[];
  sources:{title:string;url:string}[];
};

export const learningGuides:Guide[] = [
  {
    slug:'hiragana-katakana-study-routine',title:'Start reading hiragana and katakana',topic:'Reading foundations',
    description:'Learn how the two kana scripts work, practise small characters and long vowels, and build a short reading routine.',
    sections:[
      {title:'Learn sounds through useful words',paragraphs:[
        'Hiragana and katakana represent Japanese sounds. Hiragana appears in grammatical endings, particles and many everyday words. Katakana is often used for words borrowed from other languages, names from outside Japan, and emphasis. A real sentence can contain both scripts alongside kanji.',
        'Begin with あ・い・う・え・お, then work through a small row of characters at a time. Read each one aloud, write it from memory, and look for it in a word. Copying a complete chart repeatedly can feel productive while leaving recognition weak. Test yourself with the characters mixed into a different order.',
      ],examples:[{jp:'ねこ',reading:'neko',meaning:'cat'},{jp:'すし',reading:'sushi',meaning:'sushi'},{jp:'カメラ',reading:'kamera',meaning:'camera'}]},
      {title:'Notice small characters and sound length',paragraphs:[
        'The small ゃ, ゅ and ょ combine with a preceding character such as き. Compare きゃ (kya) with きや (kiya). The written size changes the sound. Small っ marks a brief closure before the following consonant. In きって (kitte, postage stamp), pause briefly before the t sound instead of reading a separate “tsu”.',
        'Vowel length also matters. In katakana, ー usually extends the preceding vowel, as in コーヒー (kōhī, coffee). Hiragana has several spelling patterns for long vowels. Learn the spelling with the whole word and listen to an audio example instead of inventing a spelling from English letters.',
      ]},
      {title:'Use a ten-minute review',paragraphs:[
        'Spend two minutes recognising yesterday’s characters, three minutes writing a few from memory, and five minutes reading actual words. Cover the romanisation on your second attempt. Keep a small list of characters you confused, such as シ and ツ, and compare their stroke direction slowly.',
        'The next day, start with your difficult characters before adding more. If you can read a word only because you remember its position on a page, shuffle the words. Once a short set feels reliable, find those characters in a lesson title, menu or recording caption. Ask your teacher to check pronunciation and handwriting, especially when two characters look similar.',
      ]},
    ],
    practice:[{prompt:'What is the reading of ねこ?',answer:'Neko. Read ね as ne and こ as ko.'},{prompt:'Which contains a small character, きや or きゃ?',answer:'きゃ contains small ゃ and is read kya. きや is read kiya.'},{prompt:'What does ー do in コーヒー?',answer:'It lengthens the preceding vowel. The word is kōhī, coffee.'}],
    sources:[{title:'Japan Foundation Irodori Starter materials and audio',url:'https://www.irodori.jpf.go.jp/en/starter/pdf.html'}],
  },
  {
    slug:'first-japanese-self-introduction',title:'Build your first Japanese self-introduction',topic:'Speaking foundations',
    description:'Introduce your name, home country and role with a short polite model, then personalise it for your class.',
    sections:[
      {title:'Start with a short, useful model',paragraphs:[
        'A first introduction works well when it gives the listener a few clear details. You can start with はじめまして, give your name, say where you are from, and finish with よろしくおねがいします. Keep the first version short enough to say without reading every word.',
        'The name in this example is a practice name. Replace it with your own name, and ask your teacher for help writing that name in katakana. Different names need different sound choices, so an automatic letter-by-letter conversion may sound unnatural.',
      ],examples:[{jp:'はじめまして。',reading:'Hajimemashite.',meaning:'Nice to meet you, said on meeting for the first time.'},{jp:'わたしはニマリです。',reading:'Watashi wa Nimari desu.',meaning:'I am Nimari.'},{jp:'スリランカからきました。',reading:'Suriranka kara kimashita.',meaning:'I am from Sri Lanka.'},{jp:'よろしくおねがいします。',reading:'Yoroshiku onegai shimasu.',meaning:'A polite closing that expresses goodwill toward your new relationship.'}]},
      {title:'Understand the pieces you are using',paragraphs:[
        'In わたしはニマリです, は introduces the topic and is pronounced wa. です makes this noun sentence polite. You can replace the name with がくせい (gakusei, student) to say わたしはがくせいです. This pattern gives you a reusable sentence, rather than one paragraph to memorise.',
        'から marks a starting point or origin. スリランカからきました is commonly used in introductions to say that you come from Sri Lanka. The closing よろしくおねがいします has no single English translation that fits every situation. Learn its use in this introduction instead of translating each part literally.',
      ]},
      {title:'Rehearse for a live online lesson',paragraphs:[
        'First read the introduction slowly with your microphone muted. Then close the text and say your name and country from memory. Record a short practice version on your own device if that helps you hear where you hesitate. Avoid adding your phone number, home address or payment information to a class introduction.',
        'For a second version, add one true detail that you can explain. A student might add がくせいです. Speak clearly, allow a short pause between sentences, and listen to your classmate’s introduction before replying. Your aim is a brief exchange that another person understands, rather than speed or a long speech.',
      ]},
    ],
    practice:[{prompt:'How is は pronounced in わたしはニマリです?',answer:'Wa. This は is the topic particle.'},{prompt:'Say “I am a student” politely.',answer:'わたしはがくせいです。Watashi wa gakusei desu.'},{prompt:'Which opening is suitable when meeting someone for the first time?',answer:'はじめまして。Hajimemashite.'}],
    sources:[{title:'Japan Foundation Irodori Starter, Lesson 3 and audio',url:'https://www.irodori.jpf.go.jp/en/starter/pdf.html'}],
  },
  {
    slug:'japanese-particles-wa-o-de',title:'Use は, を and で in simple sentences',topic:'Beginner grammar',
    description:'See how topic, object and action location work together, with original examples and short practice answers.',
    sections:[
      {title:'Look at the job of each phrase',paragraphs:[
        'Japanese particles follow the word or phrase they mark. Instead of translating a particle as one fixed English word, look for the relationship it creates in a sentence. This guide covers three common beginner uses. Each particle has other uses that you can learn later in context.',
        'Start with わたしはうちでにほんごをべんきょうします. The whole sentence means “I study Japanese at home.” It contains a topic, the place where an activity happens, the object of study, and the verb. Read it in small chunks before trying the complete sentence.',
      ],examples:[{jp:'わたしは',reading:'watashi wa',meaning:'As for me, setting the topic.'},{jp:'うちで',reading:'uchi de',meaning:'At home, the location of the activity.'},{jp:'にほんごを',reading:'nihongo o',meaning:'Japanese, the object of studying.'},{jp:'べんきょうします',reading:'benkyō shimasu',meaning:'Study, in a polite form.'}]},
      {title:'Keep pronunciation and function together',paragraphs:[
        'は is pronounced wa when used as the topic particle. It introduces what you are talking about. It does not simply mean “I”, “is”, or “am”. In わたしはがくせいです, the topic is わたし and the information about that topic is がくせいです.',
        'を marks the direct object in examples such as ほんをよみます (hon o yomimasu, read a book). The particle is normally pronounced o in standard modern Japanese. で can mark the location of an action, as in としょかんでほんをよみます (toshokan de hon o yomimasu, read a book at the library).',
      ]},
      {title:'Change one part at a time',paragraphs:[
        'Practise by changing only the location first. Replace うちで with としょかんで, keeping the rest of the sentence the same. Then change the activity and its object together. This makes it easier to hear which phrase belongs with which particle.',
        'Avoid using で for every English “at”. A sentence describing where something exists commonly uses に, as in としょかんにほんがあります (toshokan ni hon ga arimasu, there are books at the library). Reading and existing are different relationships. When you check an answer, explain what is happening before choosing a particle.',
        'Write two sentences about your own study routine. Underline the topic once and circle the place of the action. Read both aloud and ask your teacher to check the meaning. If a sentence is wrong, keep the corrected version and the reason for the correction together in your notes.',
      ]},
    ],
    practice:[{prompt:'Fill the gap in ほん＿よみます. You want to say “read a book”.',answer:'を. ほんをよみます。Hon o yomimasu.'},{prompt:'Fill the gap in うち＿べんきょうします. The studying happens at home.',answer:'で. うちでべんきょうします。Uchi de benkyō shimasu.'},{prompt:'In わたしはがくせいです, what does は mark?',answer:'It marks わたし as the topic of this sentence.'}],
    sources:[{title:'Japan Foundation Irodori Starter grammar and lesson resources',url:'https://www.irodori.jpf.go.jp/en/starter/pdf.html'}],
  },
  {
    slug:'n5-n4-study-plan',title:'Make a practical N5 or N4 study plan',topic:'Exam preparation',
    description:'Balance reading, vocabulary, grammar and listening, and turn your practice mistakes into the next week’s plan.',
    sections:[
      {title:'Choose a starting point you can measure',paragraphs:[
        'N5 is the entry level of the JLPT and N4 builds on basic Japanese. Both involve language knowledge, reading and listening. Before choosing a target, try a short reading passage and a short listening exercise at the level you are considering. Record what you can understand independently and what needs help.',
        'For an N5 foundation, check whether you can read kana, recognise common words and follow simple sentences. For N4 preparation, check whether you can follow connected everyday passages and understand how several sentences fit together. A small vocabulary quiz alone cannot show readiness for the whole examination.',
      ]},
      {title:'Balance the week',paragraphs:[
        'Use four study strands: vocabulary and kanji, grammar in sentences, reading, and listening. A short daily routine might contain ten minutes of vocabulary recall, ten minutes applying one grammar point, and ten minutes of reading or listening. Adjust that example to the time you actually have.',
        'Review a class recording with a question in mind. Pause after an explanation and write your own sentence. When listening, first try to identify the situation and the requested information. On a later attempt, check difficult words with the transcript or your teacher. Replaying audio without a task can hide the parts you still do not understand.',
      ]},
      {title:'Make errors useful',paragraphs:[
        'After practice, sort mistakes by cause. Did you miss a word, confuse two grammar patterns, overlook a negative ending, or run out of time? For each cause, choose one action you can complete. For example, a missed date in a conversation suggests practising dates in short listening exchanges.',
        'Keep an error notebook with the question topic, your reason for the wrong answer, and one corrected example. Review it several days later without looking at the explanation first. If you still repeat the error, bring it to class. The next study plan should reflect these patterns instead of simply adding more new material.',
      ]},
      {title:'Check official information before booking',paragraphs:[
        'Use the official JLPT level descriptions and sample questions alongside your course materials. Confirm dates, local registration arrangements and identification requirements with the authorised local organiser. Those details can change. Practice scores on this website are learning feedback and do not predict a certified JLPT result.',
        'A/L and O/L students should also keep their school syllabus, writing tasks and teacher feedback in their plan. JLPT practice can support language development, but a school examination has its own assessment requirements. Ask your teacher which parts of your weekly routine should follow each course.',
      ]},
    ],
    practice:[{prompt:'You know vocabulary but repeatedly miss times in audio. What should the next study session target?',answer:'Practise identifying times in short listening exchanges, then check the transcript and explain what you missed.'},{prompt:'Does a high three-question quiz score prove N4 exam readiness?',answer:'It gives feedback on those questions. Use broader reading, listening and language-knowledge practice to assess your preparation.'}],
    sources:[{title:'Official JLPT level descriptions',url:'https://www.jlpt.jp/e/about/levelsummary.html'},{title:'Official JLPT sample questions',url:'https://www.jlpt.jp/e/samples/forlearners.html'}],
  },
];
