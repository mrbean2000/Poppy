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
   Secret in Firebase, never in the frontend environment.
7. Restart Expo after changing `.env` so the public variables are loaded.

Google, Apple, and Facebook Firebase sign-in automatically create a Firebase
account the first time a provider is used. Existing email/password users can
sign in on the login screen, and password reset sends a Firebase reset email.
Signing in is required to enter the app, and the Settings screen provides
sign-out.

The existing Spring API still uses its existing numeric user IDs. Firebase
authentication does not yet link a Firebase UID to those backend users, so
Firebase login alone does not make the app's existing backend data
user-specific.
