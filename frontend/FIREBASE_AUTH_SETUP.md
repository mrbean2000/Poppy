# Firebase authentication setup

The app uses Firebase Authentication with email/password, Google, Apple, and
Facebook. New accounts can be created with Facebook, Google, or Apple; existing
email/password users can still sign in. The Firebase client configuration is
supplied through Expo public environment variables; these values identify the
Firebase project and are not server credentials. Never put Firebase Admin
credentials or private OAuth secrets in the frontend.

1. Create or select a project in the Firebase console.
2. In **Authentication → Sign-in method**, enable **Email/Password**, **Google**,
   **Apple**, and **Facebook**.
3. Add an app in **Project settings** and copy the Firebase web app config into
   `frontend/.env`, following `frontend/.env.example`.
4. In Google Cloud Console, create OAuth client IDs for iOS, Android, and Web.
   Add those IDs to the matching `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` entries in
   `frontend/.env`. Configure the appropriate package/bundle identifiers and
   redirect URIs for each client.
5. For Apple sign-in, enable the Sign in with Apple capability for the iOS app
   and configure the Apple provider's team, key, and service ID in Firebase.
   Apple authentication is only shown on supported iOS devices.
6. Create a Facebook app in Meta for Developers and configure its Facebook
   Login product. Add the Facebook App ID to
   `EXPO_PUBLIC_FACEBOOK_APP_ID` in `frontend/.env`, and configure the OAuth
   redirect URI shown by Firebase in the Facebook app. Keep the Facebook App
   Secret in Firebase, never in the frontend environment. The Expo AuthSession
   flow also needs its own redirect configured: for native development builds,
   the Facebook provider uses `fb<Facebook App ID>://authorize`, and the app
   must register the corresponding `fb<Facebook App ID>` URL scheme. Configure
   the applicable redirect in Meta and rebuild after changing native schemes.
7. Restart Expo after changing `.env` so the public variables are loaded.

Google, Apple, and Facebook Firebase sign-in automatically create a Firebase
account the first time a provider is used. Existing email/password users can
sign in on the login screen, and password reset sends a Firebase reset email.
Facebook sign-in is available on both the login and create-account screens.
Signing in is required to enter the app, and the Settings screen provides
sign-out.

## Recent history sync

The Home screen's recent-history panel stores up to 50 podcasts and 50
articles per account in PostgreSQL. Apply
[`create_recent_history.sql`](../backend/sql-scripts/create_recent_history.sql)
to the configured database. The app supplies the signed-in account's UID to
look up the corresponding PostgreSQL user; the backend does not verify a token.
Anyone with API access and a user's UID can read or change that user's history.
Restrict access at a trusted gateway or add server-side authentication before
exposing the API to untrusted clients. Saving and loading history requires a
connection to the backend.
Set `EXPO_PUBLIC_HISTORY_API_URL` in the frontend environment to the HTTPS
Spring API base URL (including `/api`). Plain HTTP is permitted only for
`localhost` or `127.0.0.1`; physical devices need an HTTPS-accessible backend.

Existing Firestore history is not automatically migrated or deleted; the
PostgreSQL lists start empty until new activity is recorded.

For password recovery, enable the Email/Password provider and configure the
password reset email template in **Authentication → Templates**. On the login
screen, choose **Forgot password?**, enter the account email, and use the link
in the Firebase email to set a new password. The confirmation does not disclose
whether an account exists; check the spam folder if the email does not arrive.
Accounts using only a social provider should continue using that provider.
