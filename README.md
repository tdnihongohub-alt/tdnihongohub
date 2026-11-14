# TD Nihongo HUB

Official Japanese tuition website, student portal and teacher workspace.

**Live website:** https://td-nihongo-hub.web.app

Built with React, TypeScript, Vite, Firebase Authentication, Firestore and Firebase Hosting. Source repository: https://github.com/tdnihongohub-alt/tdnihongohub

## Where the website runs

**Use https://td-nihongo-hub.web.app for the live website.** GitHub stores the source and runs checks; it is not the production host.

This is a React/Vite application, not a collection of standalone HTML pages. The source `index.html` loads `src/main.tsx`, where the application starts. A short or one-line HTML entry is normal. Build the application with `npm run build`; Vite writes runnable JavaScript, CSS and `index.html` into `dist/`.

Publishing the repository root through GitHub Pages does not run that build. It serves the TypeScript source entry unchanged and produces a blank page. The production deployment uses Firebase Hosting with the `dist` directory and a single-page-app rewrite for direct links such as `/student` and `/privacy`.

Do not select **Deploy from a branch â†’ main â†’ / (root)** as the production hosting method. GitHub Pages also restricts hosting online businesses; see [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Firebase remains the intended host for this tuition website. A small `hosting-redirect.js` forwards the accidental `tdnihongohub-alt.github.io/tdnihongohub/` source publication to the official Firebase site, preserving the path, query and fragment. It does not deploy the application to Pages or change navigation on the Firebase host. Existing accidental Pages publication can be removed in repository Settings â†’ Pages without deleting the source repository.

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

Private records stay in Firestore. This repository contains application code, authored learning material, public brand assets and labelled fictitious preview fixtures; it does not include a student database or Firebase credentials. Public YouTube videos remain public. Homework, worksheets and receipts use external links/WhatsApp; direct uploads, payment gateways and automated WhatsApp sending are not implemented. AdSense and Google Analytics are not enabled.

Firestore rules enforce record ownership and teacher permissions. Practice answer keys are available to the client for immediate feedback, so practice scores must not be treated as secure examination results.

## Documentation

- [Verification history and limits](VERIFICATION.md)
- [Brand sources](BRAND-SOURCES.md)
- [Generated illustration provenance](ASSET-NOTES.md)
- [Privacy Policy](https://td-nihongo-hub.web.app/privacy)

Brand assets and original teaching material belong to their respective rights holders. No open-source licence is granted by this upload.
