# Interface verification

## Longer homepage and learning benefits — 15 November 2026

Expanded the homepage below its unchanged hero. Eight learning-benefit cards explain existing live classes, recordings, assignments/forms, quizzes/results, scheduling, feedback, payments and communities. Replaced the earlier static portal illustration with a five-stop interactive walkthrough and a light/dark preview toggle, explicitly labelled as an illustrative preview. Added three real published free recordings from the loaded channel library, a four-step joining guide, ten native FAQ accordions and a closing class/portal call to action. Preserved the five-exam explorer and public channel cards. No invented outcomes, fees, testimonials or available class times were added; enrolment approval and practice/official-mark distinctions are explained. Only public presentation changed; no live student records or permissions changed. TypeScript, production build and all 66 tests pass. Browser preview is unavailable in this chat, so new section interactions and viewport fit have not been checked in a live browser.

## Five-exam explorer and crossed flags — 15 November 2026

Added an interactive homepage guide for exactly JLPT, JFT-Basic, NAT-TEST, JLCT and J.TEST, following the user's five-exam limit. Goal filters and exam buttons change the detail view; JLPT levels N5→N1 have separate summaries, and a toggle reveals an exam-purpose comparison table. Descriptions and benefits were checked against official provider pages, with direct source links embedded in each detail card and an explicit distinction between language certificates and guaranteed admission/employment/visa outcomes. No examination dates or fees are hardcoded. JFT-Basic wording reflects the current official A1–A2 assessment description.

Added a small crossed Japan/Sri Lanka flag detail alongside the hero's introductory label. Accurate SVG flag assets were downloaded from flagcdn.com/jp.svg and flagcdn.com/lk.svg into public/flags; Sri Lanka's lion emblem is retained. Other hero artwork and controls remain unchanged. TypeScript, production build and 65 tests pass, including five-exam scope, goal coverage, source links, JLPT order and default control/flag rendering. Browser preview remains unavailable, so this change has not been visually or interactively verified in a live browser.

## Full-width header and community dropdown — 14 November 2026

Expanded the public header to page-edge padding (24px desktop, 14px phone) with the logo at the left, desktop navigation centered, and social icons plus login/workspace action at the right. Added a header placement for the existing YouTube/WhatsApp community control; retained the hero control and artwork unchanged. Each menu instance uses a unique React-generated ID for its aria-controls relationship. The header dropdown opens downward on desktop, uses a reachable fixed panel on phones, has a hover bridge and supports focus, click/tap, Escape and dismissal. Public links continue to come from the existing settings and public group documents; no data or permission changes were needed. TypeScript, production build and all 62 tests pass. Browser preview was unavailable in this chat, so this revision has not been visually inspected at runtime.

## Public inner pages and teacher management styling — 14 November 2026

Extended the pink/white Japanese studio direction to home sections below the hero, courses, course details, free lessons, about/contact and login. Added rose paper surfaces, Japanese heading motifs, blossom-ring course covers, white lesson panels and a study-window login illustration. Teacher record pages now have coordinated page banners, readable tables, polished forms, attendance state colours and calendar surfaces, using the existing light/dark teacher tokens. No hero source, artwork, interaction or style was changed: the homepage `.public-restyle` wrapper starts after the hero's closing section, and new CSS rules are scoped to that wrapper or teacher workspace. Static selector audit checked 170 public and 98 teacher selectors for scope. TypeScript, production build and all 62 existing tests pass. Browser visual verification was unavailable in this chat; no screenshots or visual-fit claims are made for this revision. Existing student styling and Firebase data are unchanged.

## Teacher studio, wordmark and community links — 14 November 2026

Teacher screens now share the illustrated sakura study-studio direction, with teacher-specific light/dark preference storage. Text branding uses TD Nihongo HUB; the supplied logo is preserved. Added hero YouTube icon and hover/focus/tap WhatsApp dropdown, public channel cards, public group listings on free lessons/free-course details, and student Community navigation. The six supplied invitations were labelled using their public invitation-page titles, without joining any groups. At the user's explicit request all six are public: N5 Squad, N4 Squad, N3 Squad, O/L Squad, 2028 A/L Squad and 2027 A/L Squad. The exact supplied channel and invite URLs are stored in Firebase; public brand updates preserve other settings.

Teacher Brand & settings manages channel URLs and group invitations. Groups support public or approved-student visibility, optional private-batch scope, and hiding. Rules deny public reads of private/hidden links and student edits. Source queries fetch public groups for visitors and combine eligible private groups for linked active students. All 62 app tests and 28 rules simulations pass. Local teacher preview inspected in light/dark and at 390px width without horizontal overflow. Live public dropdown checks are recorded after deployment.

Final live checks: anonymous Firestore query returns all six public group names; free-lessons page renders the same six invitations; homepage WhatsApp menu contains seven links (channel plus groups). At 390×844 the final touch menu stays within the viewport (top 212, bottom 632, left 20, right 355.2) without horizontal overflow. The public YouTube icon points to the supplied channel. Fixed an anonymous-auth initialization race, moved published/public reads to Firestore Lite's REST transport after observing a stream connection timeout, and added Hosting Cache-Control: no-cache to prevent cached HTML selecting an older application bundle. The final live browser check used the newest bundle; no private student records were used in the public link tests. Temporary viewport override was reset.

## Student quizzes and mark records — 14 November 2026

Added Quizzes and Marks navigation and routes. Published questions form course/topic practice sets; free published courses and approved paid access determine availability. Completed quizzes can save an advisory result to the owner-scoped `quizAttempts` collection. Student updates/deletes to saved attempts are denied. Marks lists the student's reviewed, numeric assignment marks (including zero) and written feedback; practice history is a separate tab. Existing practice inside class pages also supports saved results. Old preview caches initialize the new collection safely.

TypeScript and build pass; 58 application tests pass. Twenty-two Firebase rules simulations pass, including own/other practice reads, valid saves, impersonation, immutable history and invalid scores. The rules simulator infers ISO text as timestamps, so its completedAt fixture uses plain text to exercise the string rule; actual UI writes ISO strings through the Firestore SDK. Local sample-data browser QA completed a quiz, saved one result, found it in practice history and checked official-mark empty states in both light/dark views. This local preview did not create live sample quizzes or marks. Live practice-result writes by a real student account remain an end-to-end launch check.

Teachers publish questions via Teacher workspace → Lessons & practice → Practice bank. Reviewed assignment marks populate student mark records automatically; no historical grades are invented.

## Student study-studio redesign — 14 November 2026

Rebuilt the student landing area around an original, code-native SVG Japanese study-garden illustration, personal welcome, real lesson-progress ring and an interactive daily vocabulary card. Reduced the oversized class/resume blocks, refined the student navigation and user-profile contrast, and added real public video discovery for students with no saved/enrolled courses. Light and dark palettes use shared studio tokens; every new style is restricted to student workspace markup. Public and teacher screens remain unchanged. Local sample-data browser checks covered desktop light/dark, daily-word reveal (hon → book) and 390px phone layout without horizontal overflow. All 53 tests pass, including a new unenrolled-student rendering check. No live student or financial records changed.

## Student dark mode — 14 November 2026

Added a keyboard-accessible student-header toggle, device-preference default, and browser-local preference storage with a safe fallback if storage is blocked. Dark styles are restricted to the student workspace and include tables, lesson screens, forms/dialogs, native controls, badges, calendars and dashboard cards. Public and teacher styles retain their previous appearance. TypeScript and production build pass; 52 tests pass, including five preference checks. A separate local sample-data build was used for browser QA: dashboard and payment dialog visually inspected, dark selection persisted after reload/re-entering the preview, both toggle directions worked, and navigating home restored the original ivory background. The preview had Firebase disabled and did not write live student or payment records.

## Sakura theme — 14 November 2026

Scope correction: the user requested pink and white only for the student side. All sakura-theme selectors and color variables are gated by the student workspace marker. Public pages and teacher pages use their original styles, and the public 3D scene colors were restored. TypeScript, production build and all 47 tests pass after this correction.

Pink-and-white visual redesign published to Firebase Hosting. Updated public pages, course cards, login, workspace surfaces and 3D scene palette. TypeScript, production build and all 47 tests passed. Browser screenshots inspected at desktop and 390px phone widths; no horizontal overflow found on the home page. Final course-level colors checked in the published page. Authenticated teacher/student screens received shared styles but were not visually inspected while signed in during this revision.

## Firebase setup — 14 November 2026

- Published to https://td-nihongo-hub.web.app; home, login route and logo return HTTP 200.
- Email/password and Google providers verified enabled; authorized domains include both Firebase domains, localhost and 127.0.0.1.
- Standard Firestore `(default)` database verified in Mumbai (`asia-south1`), with `freeTier: true`.
- Rules compile successfully; deployment dry run passed; rules and assignment composite index deployed successfully.
- Sixteen rule tests passed through Firebase's server-side `projects.test` API using mocked document lookups. Covered public lessons, own/other student records, unverified users, self-promotion, teacher access, teacher notes, payment/fee/grade tampering, released/future assignments, open/closed submissions and unapproved paid lessons. These are rules simulations, not complete browser workflows or emulator query tests.
- Live anonymous queries returned four published courses and six public lessons. Anonymous student collection access returned HTTP 403.
- Initial public brand/course/video content seeded with create-only operations; no demo students or finances imported.
- Emulator-based checks could not run because its binary download stalled; the remote rules simulations were used instead.
- Owner reported successful website sign-in. The verified project-owner account was found in Firebase Authentication and its teacher document was created with `enabled: true`. Sign out and back in to refresh the website's role. Website recheck returned HTTP 200.
- Pending: teacher workspace browser check, email/password login and verification/recovery emails, student read/write workflows and query isolation, payment concurrency, custom domain and legacy migration. No real student data imported.

The remaining entries below record interface checks from before Firebase was connected.

- TypeScript compilation: passed.
- Production Vite build: passed.
- Automated checks: 47 passed across forms/scheduling, branding, logic, teacher/student dashboard behaviour and page-render tests.
- Local Vite preview HTTP check: 200 with the TD Nihongo Hub page.
- Automated visual browser inspection: unavailable; browser-control connection timed out.

Covered: public page rendering, course details, the free-library fallback, contact details, teacher attention queue, class/batch/lesson/assignment tables, student list, schedule, attendance, fee records, brand settings, review queues, reminder tools, student dashboard, class lessons, homework and payment pages, unapproved-class interface, monthly balances, part payments, voided payments, weekly recurrence, attendance percentages, link validation and CSV escaping.

These are interface and local logic checks. Live Firebase authentication, Firestore rules, concurrent payment confirmation against a live database, migration, and domain setup have not been verified. No real student data was used.

Packaged production preview routes (home, student class, teacher payments): passed.

Editorial/cultural hero revision: TypeScript compilation, production build and all 24 tests passed again. Local hero WebP request: HTTP 200, 403,850 bytes. The artwork was visually inspected in image-generation output. Live browser interaction inspection remains unavailable.

Landscape/3D classroom revision: all 24 tests pass, including checks for the Japanese headline, class-learning copy and pause control. Three.js is a separate lazy-loaded chunk. The local preview serves the new heading, wind controls and scene code. GPU rendering and exact viewport fit have not been visually measured in a live browser session; responsive viewport rules and static fallback are included.

Student learning-desk revision: 29 tests pass. Added checks that ended sessions are not presented as upcoming, ongoing sessions stay available, overdue and returned work remain actionable, student progress/feedback/fees are scoped to the current student, and continue learning selects an incomplete lesson. TypeScript and production build pass. The local preview serves the new dashboard code. Live browser visual inspection remains unavailable.

Teacher-desk revision: 35 tests pass. Added checks for same-day missing recordings, deduplication by lesson, excluding cancelled/ongoing sessions from recording tasks, overdue preparation priority, exact review links, monthly receipts allocated by receipt date, preserved older balances, and direct creation forms. TypeScript and production build pass. The local preview serves the updated teacher desk and attention filters. Live browser visual inspection remains unavailable.

Brand-content revision: 39 tests pass. Checks cover the supplied logo path, real public recording URLs/levels, preservation of demo content, the verified phone number, and absence of an unverified WhatsApp link. Channel metadata and video titles were read from the public About and Videos pages. TypeScript and production build pass. No live Firebase records have been changed.

Native form and scheduling revision: 47 tests pass. Added tests for Sri Lanka time conversion, release boundaries, hidden drafts, deadline closing and late-response allowance, legacy due dates, invalid schedule ordering, required form answers and choice options, plus editor rendering. TypeScript and production build pass using Vite's runner config loader because the config bundler encountered a sandbox parent-directory read restriction. Updated Firebase rules and indexes are included, with migration notes; they have not been deployed or verified against a live Firebase project. The preview serves the form builder and deadline controls.


## Monthly level practice — 15 November 2026

- Added `/student/check-level` and individual quiz routes; linked from the dashboard, sidebar and class-quizzes page.
- Imported the 9 reviewed mini-quizzes / 27 original questions without changing their options, answers or explanations.
- November 2026 collection has three tracks and three within-track difficulty sets. Daily/weekly additions are labelled Coming soon; no automated publishing or future questions are implied.
- One practice point per correct answer. Monthly total sums best scores per quiz (maximum 27); a zero-score attempt still counts as completion.
- Answers remain editable before submission; feedback and distractor explanations appear after submission. Attempts save to the signed-in account in `levelAttempts`, with retry-on-failure using the same ID.
- Saved history is separate from teacher-reviewed marks. Firestore rules enforce ownership, immutable results (identical retries allowed), known quiz IDs and bounded scores. Scores remain client-calculated advisory practice.
- Validation: TypeScript and Vite production build passed; 72 application tests and 43 Firebase Rules API checks passed. The Rules API coerces ISO-formatted timestamp fixtures, so its date fixture uses plain text; the app stores ISO timestamp strings via the Firestore SDK.
- Visual browser and real student-account end-to-end testing were unavailable in this chat.


## Reading clarity — 15 November 2026

Added scoped `readability.css` after theme styles. Main public video/course/exam descriptions are 16px, weight 500, dark ink on white or #fff8fb surfaces; headings and facts have stronger weights. Exam comparison, FAQ, metadata and portal reading records received readable sizes. Workspace overrides use separate light/dark reading tokens. Hero artwork/layout remain outside this scope.

Checked representative foreground/background pairs mathematically: #51434d on white 9.29:1; #51434d on #fff8fb 8.88:1; #65515e on #fff8fb 6.94:1; dark text #d5c1d0 on #241e2b 9.55:1. These are palette checks, not a complete computed-style accessibility audit. TypeScript, all 72 tests, and final Vite build passed. Browser visual testing remains unavailable following the earlier browser URL verification stop.


## Hero features and petal placement — 15 November 2026

Moved all three WebGL course labels into a bounded upper row (normalized x .26/.53/.80 and y .84, z=0), reduced sway and scale, and excluded hidden sprites from pointer hit tests. Labels are hidden on narrow layouts where the existing accessible class picker remains available. Expanded hero benefits into five linked cards: live classes, recordings, quizzes, progress/points and teacher-reviewed homework. Each uses distinct icon, wording and accent colour. On narrow screens the cards flow below the illustration instead of overlapping it. Public header and expanded mobile navigation now use white backgrounds.

TypeScript, application tests and production build checked. Browser layout verification remains unavailable following the earlier Computer Use URL verification stop.


## Font family refinement — 15 November 2026

Consolidated Latin UI and reading typography from DM Sans / Manrope to Inter (400–800), with Noto Sans JP and Noto Sans Sinhala fallback families. Existing decorative serif accents remain. Added final typography stylesheet with regular-weight 16px long descriptions, semibold benefit headings, consistent label spacing and tabular numbers for records. Preserved the recent high-contrast palette. TypeScript, 72 tests and production build passed. Live browser appearance not visually verified in this chat.


## Culture collection and automatic practice checking — 21 November 2026

Added a lazy-loaded teacher Culture library containing 56 unpublished templates / 1,120 multiple-choice questions across the 28 requested weeks. Week 22 is February; week gaps are retained. Each quiz has 20 required questions, four distinct options, a valid correct-answer index, an explanation, source reading and balanced answer positions. Revision draws learning points from all 27 earlier topics. Recognition questions and scenario/definition questions form each pair. Templates are independent of existing teacher records and are not automatically saved, assigned or published.

The editor supports answer keys, explanations and one-mark-per-question automatic practice scoring. Student results appear only after a saved submission, restore when reopened, and appear separately in Practice history. Official teacher marks remain unchanged. Approved class access and release times govern quiz visibility. The teacher attention queue omits successfully checked practice but retains incomplete responses for review. Answer keys remain client-accessible practice material; this is not secure examination grading.

Validation: all 286 tests across 43 files passed. Coverage includes counts and answer-key integrity across all 56 quizzes, February and revision coverage, 20/20, 0/20 and mixed scores, missing/invalid answers, key editing, draft concealment, submitted result display, history, audience/release restrictions and preservation of ordinary homework feedback. TypeScript and the Vite production build passed. The Culture bank is a separate 86 kB lazy-loaded chunk (about 31 kB compressed); the pre-existing large main bundle still produces a size warning. No browser visual or real-account end-to-end test was performed.

The export script generated a standalone searchable teacher-review HTML booklet with local practice checking and expanded JSON. Structural checks verified 28 sections, 56 forms, 1,120 questions, 4,480 choices and 1,120 correct-answer flags; its JavaScript parsed successfully.

Release status: not deployed. A separate read-only Firebase access check still returned 429 RESOURCE_EXHAUSTED / Quota exceeded. The pending multi-batch access-metadata prerequisite has not run, so the live interface and production data were left unchanged. No student, enrollment, payment, lesson or existing assignment record was modified.
