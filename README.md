# DASLONGO

Responsive Uzbek-language learning app with a modular HTML/CSS/JavaScript frontend.

## Run locally

Serve this folder over HTTP (the Supabase client and browser storage APIs require a web origin), for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Configure sign-in

1. Create a Supabase project and enable email/password authentication.
2. In **Authentication → URL Configuration**, add the local and production app URLs to the allowed redirect URLs.
3. Add the project URL and public anon/publishable key to `js/config.js`:

   ```js
   window.DASLONGO_CONFIG = {
     supabaseUrl: "https://YOUR_PROJECT.supabase.co",
     supabaseAnonKey: "YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY"
   };
   ```

4. To enable Google, Apple, or GitHub, configure that provider in Supabase and its OAuth application. Use `https://YOUR_PROJECT.supabase.co/auth/v1/callback` as the provider callback URL, and allow the DASLONGO app URL as a redirect.

Only public client credentials belong in `js/config.js`. Never put a Supabase service-role key or OAuth client secret in frontend code. Until configured, email sign-in reports the missing setup and OAuth buttons remain disabled; the app does not simulate a successful login.

## DASLONGO PLUS

Five-heart access is granted only when the authenticated user's Supabase `app_metadata.daslongo_plus` value is the boolean `true`. Set that claim only through a trusted Supabase admin/server workflow; never set it from browser code or user-editable metadata. Subscription checkout and entitlement management are not included.

The learning progress is stored in this browser's local storage. Profile photos are optimized and stored in IndexedDB on this device; neither progress nor photos currently sync between devices.
