# Connect your Firebase project

The interface can be reviewed without Firebase using the labelled preview on the login page. These steps activate real accounts and records.

1. Create a Firebase project on the **Spark** plan. Do not enable billing, Storage, Functions, or App Hosting for this release.
2. Register a Web app and copy the public web configuration into a local `.env.local` file using `.env.example`. The Firebase web API key is configuration, not an administrator secret. Never add service-account keys to frontend files or GitHub.
3. Enable **Authentication → Google** and **Email/Password**. Configure your support email, verification and password-reset email templates, and authorized domains. Email verification is required for student data access.
4. Create **Cloud Firestore**. Deploy the included `firestore.rules` and `firestore.indexes.json` after testing them with the Firebase Emulator Suite. They deny client creation of teacher roles, separate teacher notes, and scope student records to teacher-created account links.
5. Create your own account through the website. In the Firebase console, create `teachers/YOUR_AUTH_UID` with `{ "enabled": true }`. This trusted setup step is not available in the website. Do not give students teacher documents.
6. Sign out and back in. The account now opens the teacher workspace.
7. Configure branding. Create your courses and batches, add student records, and link accounts after verifying the student's identity and email. Students cannot link or approve themselves. A paid access request can be approved by matching it to a student and batch.
8. Deploy the frontend to **Firebase Hosting** (the static hosting product) and attach your purchased domain. Add the resulting domain to Authentication's authorized domains.

```sh
npm install
npm run build
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only hosting,firestore
```

The supplied web app configuration is saved locally in `.env.local` (excluded from Git). `.firebaserc` selects your real project, `td-nihongo-hub`. Analytics is not initialized. On 14 November 2026, Authentication providers were verified enabled, the Standard `(default)` Firestore database in `asia-south1` was verified with free-tier eligibility, and Hosting, rules and indexes were deployed successfully. Live site: https://td-nihongo-hub.web.app. Public branding, four courses and six real YouTube lessons were added without sample students, batches or financial records. Teacher setup still requires the project owner to sign in to the website, after which their verified account can receive its teacher document. End-to-end sign-in, verification/recovery emails, student writes and real payment workflows remain to be tested.

## Required checks before real students use it

- Verify Google sign-in, email verification, password recovery, logout, and your custom domain.
- Test the rules with anonymous, unverified, verified-student, and teacher identities.
- Confirm that one student cannot read another student's profile, attendance, fee records, claims, submissions, account links, or teacher notes.
- Confirm that students cannot write teacher roles, grades, fee snapshots, confirmed payments, enrolments, course access, announcements or audit records.
- Confirm suspended/inactive students cannot fetch paid lessons or Zoom sessions directly.
- Confirm self-created payment claims must start awaiting review; clarification updates cannot self-confirm a claim or change ownership, batch or billing month.
- Confirm a submitted/reviewed assignment is locked until the teacher returns it.
- Confirm both matching reads and query filters are authorized; Firestore rules are not client-side filters.
- Check link sharing permissions on external worksheets, submissions and receipt links.
- Test two simultaneous payment confirmation attempts; there must be one payment record.
- Verify fee snapshots and opening balances before importing historic data.

## Existing data

### Assignment scheduling compatibility

Deploy the updated assignment index and rules with `firebase deploy --only firestore` before activating scheduling. Existing Firestore assignments must be saved once in the new editor (or migrated by the administrator) to add `releaseAt: 0`, `deadlineAt` in epoch milliseconds, `allowLate: true`, `kind: "assignment"` and `formQuestions: []`. Preserve the old due date as 23:59:59 Asia/Colombo when creating `deadlineAt`. The student query uses `releaseAt <= now`, so records without that field will not be returned by Firestore. Local preview records retain date-only compatibility automatically.

Published assignments are protected by a server-time release check. Closed deadlines are checked by Firestore rules using `request.time`, independently of the browser. No scheduled background service is used: availability is evaluated when students read or submit; the active student portal refreshes data once per minute, and its work list updates every 15 seconds. Rules, indexes and live reads/writes have not been tested in a connected Firebase project. Native form required-answer validation is a user-interface check; these remain teacher-reviewed forms, not secure examinations. Do not treat client-supplied submission timestamps or late labels as tamper-proof exam records.

The old app stores data in Cloudflare D1. Keep it running while preparing migration. Export a backup through the existing administrator's authorized environment. Preserve original IDs; map classes to courses and carry batch, student, attendance and payment IDs forward. Legacy payment months must be reviewed because the old app inferred billing months from receipt dates. Do not automatically infer historic unpaid fees. No live export or migration was performed during this interface build.

## Cost boundaries

Videos stay on YouTube. Receipts stay in WhatsApp or external links. Homework is text or an external link. No Cloud Storage, payment gateway, messaging service, background job or paid API is required by the interface. Free-plan quotas still apply; monitor usage in Firebase. Do not enable services requiring billing to make this interface run.
