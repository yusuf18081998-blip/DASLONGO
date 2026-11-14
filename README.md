# DASLONGO

Responsive Uzbek-language learning app with a modular HTML/CSS/JavaScript frontend.

## Run locally

Serve this folder over HTTP (the Supabase client and browser storage APIs require a web origin), for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Android app

DASLONGO can be packaged as an Android app with Capacitor. Install Node.js 22 LTS and Android Studio (including its Android SDK), then run these commands from the project folder:

```sh
npm install
npm run android:add
npm run android:open
```

`android:add` creates the native Android project the first time. Open it in Android Studio, let Gradle sync, then use **Build → Generate Signed Bundle / APK** to create a release for Google Play. For later web-code changes, run `npm run android:sync` before building again. Keep the generated `android/` project in source control; signing keys and `android/local.properties` must remain private.

The Android wrapper loads the app's local web assets. Supabase authentication and the Tailwind CDN currently require an internet connection. Android OAuth/deep-link handling and production builds still need device/Play Console testing; creating a Capacitor project does not by itself make a Play Store-ready release.

## Configure sign-in

The app opens on a public introduction page. The learning dashboard and courses are only available after a user signs in; a new account is guided through onboarding after authentication.

1. Create a Supabase project and enable email/password authentication.
2. In **Authentication → URL Configuration**, add the local and production app URLs to the allowed redirect URLs.
3. Add the project URL and public anon/publishable key to `js/config.js`:

   ```js
   window.DASLONGO_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
   };
   ```

4. To enable Google, Apple, or GitHub, enable the provider under **Authentication → Sign In / Providers** in Supabase and configure its OAuth application credentials. For Google, create a Web OAuth client in Google Cloud, add `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud, then paste the client ID and secret into Supabase's Google provider settings. Also allow the DASLONGO app URL under **Authentication → URL Configuration**.

Only public client credentials belong in `js/config.js`. Never put a Supabase service-role key or OAuth client secret in frontend code. If Google login returns `Unsupported provider: provider is not enabled`, the Google provider is not enabled/configured in Supabase; finish the provider setup above. Until authentication is configured, the dashboard remains inaccessible and the app does not simulate a successful login.

## DASLONGO PLUS

Five-heart access is granted only when the authenticated user's Supabase `app_metadata.daslongo_plus` value is the boolean `true`. Set that claim only through a trusted Supabase admin/server workflow; never set it from browser code or user-editable metadata. Subscription checkout and entitlement management are not included.

The learning progress is stored in this browser's local storage. Profile photos are optimized and stored in IndexedDB on this device; neither progress nor photos currently sync between devices.

## Course learner counts

Course cards show live counts of authenticated DASLONGO accounts enrolled in each course. Counts are not sample or third-party statistics. To enable them, run [`supabase/migrations/20260705000000_course_learner_counts.sql`](./supabase/migrations/20260705000000_course_learner_counts.sql) in the Supabase SQL Editor. Learners must sign in for their course enrollments to contribute; anonymous local enrollments are synced after sign-in. If the migration has not been run or Supabase cannot be reached, cards say so instead of displaying invented counts.

## Lessons

Every course module starts with an Uzbek reading, example, and key takeaways. The learner explicitly starts the module quiz with **“O‘rgandim — testni boshlash”**. Modules unlock in order: pass the current module's three-question quiz to open the next one. Previously completed modules can be reviewed, but the next incomplete module cannot be skipped; each wrong answer uses the heart system.

## Courses and personal study plans

The Courses page displays enrolled and available courses in a responsive, centered tile grid; enrolled courses have a check mark. It includes IELTS, chess, football, Japanese, Russian, Kyrgyz, mathematics, biology, English, and Spanish alongside the original programming and technology courses. Microsoft Office is available as an overview course, with separate six-module courses for Word, Excel, PowerPoint, Outlook, OneNote, and Access, so learners can choose only the application they need. Choose a ready-made course tile to add it to the study list; creating custom courses is not available.

Lesson content is currently in Uzbek (with target-language examples where relevant). Verify specialized or changing facts with trusted sources.

Plus currently displays learning statistics and grants five hearts only to accounts with the trusted Supabase entitlement described above. No paid subscription or checkout is connected.
