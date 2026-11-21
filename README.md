# TD Nihongo HUB

Official Japanese tuition website, student portal and teacher workspace.

**Live website:** https://tdnihongohub.com

Built with React, TypeScript, Vite, Firebase Authentication, Firestore and Firebase Hosting. Source repository: https://github.com/tdnihongohub-alt/tdnihongohub

## Website hosting

Firebase Hosting serves the production site at https://tdnihongohub.com and https://td-nihongo-hub.web.app. GitHub stores the source and runs interface checks.

Build the React/Vite application using npm run build. Deploy the resulting dist directory using Firebase Hosting. The Hosting rewrite supports direct links such as /student, /privacy and /courses.

Firebase Authentication and Firestore provide student accounts and teaching records. The custom hostname must be included in Authentication's authorized domains. Spaceship DNS points the domain to Firebase using the records shown in the Hosting console.

## Local setup

Use Node.js 22 or later and npm.

```sh
npm ci
```

Copy `.env.example` to `.env.local` and fill in the Firebase web-app configuration from your own Firebase console. Do not commit `.env.local`, service account keys, access tokens or student exports.

```sh
npm run dev
```

Vite prints the local address. Without Firebase configuration, the login page offers a labelled sample-data preview. With Firebase configured, use real verified accounts. Teacher access is controlled through a trusted teacher document, not through student registration.

## Checks and production build

```sh
npm test
npm run build
npm run preview -- --port 4173
```

The Windows `Start Preview.cmd` also serves an existing `dist` build after you run `npm run build`. Dependencies and generated `dist` files are intentionally excluded from GitHub.

## Main features

- Public courses, free YouTube lessons, exam guidance, About, Contact and Privacy Policy.
- Japanese-inspired illustration, sakura scene, responsive layout and readable Inter typography, with Japanese and Sinhala font support.
- Verified Google/email sign-in, password recovery, teacher/student navigation and access controls.
- Student classes, recordings, notes, timetable, attendance, assignments and scheduled custom forms.
- Monthly level practice: 9 original A/L, N5 and N4 mini-quizzes, 27 questions, answer explanations, best-score points and private attempt history. Practice marks are advisory, not certified examination grades. Daily and weekly additions are labelled Coming soon; there is no automatic question publishing.
- Student marks, teacher feedback, announcements, payment claims and community links.
- Teacher management of courses, batches, enrolments, lessons, attendance, fees, payment clarification, homework and preparation tasks.
- Separate light/dark workspace themes; LKR and Asia/Colombo defaults.

## Firebase deployment

The included `.firebaserc` selects the existing `td-nihongo-hub` project. Confirm that you intend to deploy to this project before running a deployment. No deployment credentials are included.

```sh
npx firebase-tools login
npm run deploy
```

The deploy command builds the app and publishes Hosting plus Firestore rules/indexes. Database content is separate from source code: deploying does not migrate or seed students, fees or course records. A fresh Firebase project requires its own published content and trusted teacher setup. See [FIREBASE-SETUP.md](FIREBASE-SETUP.md) for setup details and historical implementation notes.

GitHub Actions runs dependency installation, tests and a build on pushes and pull requests. It does not deploy to Firebase. The CI build without environment values checks the sample-data configuration; production deployments need the real Firebase web configuration.

## Data and scope

Private records stay in Firestore. This repository contains application code, authored learning material, public brand assets and labelled fictitious preview fixtures; it does not include a student database or Firebase credentials. Public YouTube videos remain public. Document uploads are prepared but remain disabled until Firebase Storage is provisioned. External document links and WhatsApp receipts continue to work. Payment gateways and automated WhatsApp sending are not implemented. AdSense code is present; Google Analytics is not enabled.

## Activating document uploads

The project currently has billing disabled and no Storage bucket. The owner must first choose Firebase's Blaze plan and create a Storage bucket. This code does not enable billing or provision chargeable resources.

After that setup:

1. Confirm the bucket name (the default is `td-nihongo-hub.firebasestorage.app`); set `VITE_FIREBASE_STORAGE_BUCKET` if different.
2. Deploy `firestore.rules` and `storage.rules`. Storage's cross-service Firestore access requires its service-agent permission setup through Firebase.
3. Configure the bucket CORS policy for authenticated browser downloads from the production and development origins.
4. Test teacher lesson/worksheet uploads, permitted student submissions, other-student denials, expired file grants and downloads. No complete upload/download test is possible until the bucket exists.
5. Only after those checks, set the teacher-only-writable Firestore document `settings/uploads` to `{ "enabled": true }` and refresh the workspace.

Files are limited to 10 MB, with PDF, Word, text and selected image types. File fields support drop, choose, progress and cancellation. Existing links are preserved. Files use authenticated downloads without embedding permanent download tokens in teaching records. Short-lived Firestore grants check lesson and assignment permissions before Storage reads/writes, within Storage's two-document lookup limit. Removing an attachment from a form removes its reference; it does not delete the stored object. Storage object listing, overwrites and deletions are denied by default. Unused objects can be reviewed by the owner in Firebase Storage. Videos continue to use YouTube.

Firestore rules enforce record ownership and teacher permissions. Practice answer keys are available to the client for immediate feedback, so practice scores must not be treated as secure examination results.

## Documentation

- [Verification history and limits](VERIFICATION.md)
- [Brand sources](BRAND-SOURCES.md)
- [Generated illustration provenance](ASSET-NOTES.md)
- [Privacy Policy](https://td-nihongo-hub.web.app/privacy)

Brand assets and original teaching material belong to their respective rights holders. No open-source licence is granted by this upload.
