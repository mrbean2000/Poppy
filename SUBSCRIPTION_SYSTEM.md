# Subscription System Implementation

## Overview

The app now automatically navigates users to either the Trial Offer screen or Home screen based on their subscription status when they sign in.

## How It Works

### Architecture

The subscription checking system uses a **two-tier approach**:

1. **Primary: Firebase Custom Claims** (backend-set)
   - Fastest, most secure
   - Set by backend when payment is processed
   - Requires backend implementation

2. **Fallback: Firestore Database**
   - More flexible for testing
   - Can be set from client or backend
   - Stored in `users/{uid}/subscription/` document

### Step-by-Step Flow

#### 1. User Signs In
```
User clicks "Sign in" → Enter email/password
```

#### 2. Firebase Authentication
```
Firebase authenticates credentials
↓
onAuthStateChanged listener detects user
↓
AuthContext updates user state
```

#### 3. App Checks Subscription Status
```
App.js detects user logged in
↓
Calls checkSubscriptionStatus()
↓
Returns { hasActiveSubscription: true/false }
```

#### 4. Conditional Navigation
```
If hasActiveSubscription === true
  ↓
  Navigate to → HOME SCREEN
  User can use app normally

If hasActiveSubscription === false
  ↓
  Navigate to → TRIAL OFFER SCREEN
  User must select a plan
```

### Subscription Check Logic

#### Option 1: Firebase Custom Claims (Primary)

**Checking:**
```javascript
const idTokenResult = await user.getIdTokenResult(true);
const subscriptionExpiry = idTokenResult.claims?.subscriptionExpiry;

if (subscriptionExpiry) {
  const now = new Date().getTime();
  const expiryTime = new Date(subscriptionExpiry).getTime();
  return expiryTime > now; // true if active, false if expired
}
```

**Setting (Backend):**
```javascript
// Node.js / Firebase Admin SDK
const admin = require('firebase-admin');

// After payment is processed
const expiryDate = new Date('2025-12-31').toISOString();
await admin.auth().setCustomUserClaims(userId, {
  subscriptionExpiry: expiryDate
});
```

#### Option 2: Firestore Database (Fallback)

**Checking:**
```javascript
const userDocRef = doc(db, "users", user.uid);
const userDocSnapshot = await getDoc(userDocRef);
const subscriptionData = userDocSnapshot.data().subscription;

// Firestore document structure:
// users/{uid}/subscription/{
//   expiryDate: "2025-12-31" or Timestamp,
//   plan: "annual" or "monthly",
//   status: "active" or "expired"
// }
```

**Setting (Backend or Client):**
```javascript
// Node.js (Backend)
const admin = require('firebase-admin');
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 14); // 14-day trial

await admin.firestore().collection('users').doc(userId).set({
  subscription: {
    expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
    plan: 'trial',
    status: 'active'
  }
}, { merge: true });
```

Or **Testing (Client-side):**
```javascript
// React Native - set test subscription
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 14);

await setDoc(doc(db, 'users', user.uid), {
  subscription: {
    expiryDate: expiryDate.toISOString(),
    plan: 'annual',
    status: 'active'
  }
}, { merge: true });
```

## User Experience

### Scenario 1: User Has Active Subscription

```
Sign in → Check subscription → Found active → Home screen ✓
```

- User logs in with email/password
- Subscription check finds active subscription
- User navigates to Home screen
- Can use app normally

### Scenario 2: User Has No Subscription (New User)

```
Sign in → Check subscription → Not found → Trial Offer screen ✓
```

- New user just created account or never purchased
- Subscription check finds no subscription data
- User navigates to Trial Offer screen
- User can select Annual or Monthly plan
- After selecting plan, user navigates to Home screen

### Scenario 3: User's Subscription Expired

```
Sign in → Check subscription → Found expired → Trial Offer screen ✓
```

- User's previous subscription expired
- Current date is past the `expiryDate`
- Subscription check returns `hasActiveSubscription: false`
- User navigates to Trial Offer screen
- User can purchase a new subscription
- After purchasing, navigate to Home screen

### Scenario 4: Error Checking Subscription

```
Sign in → Check subscription → Error occurs → Trial Offer screen ✓
```

- Any error while checking subscription (network issue, Firestore error, etc.)
- App defaults to showing Trial Offer screen (safe default)
- User can still select a plan

## Subscription Status Return Value

```javascript
{
  hasActiveSubscription: boolean,  // true if active, false if expired/missing
  subscriptionExpiry: string|Date, // expiry date/time
  subscriptionPlan: string,        // "annual", "monthly", "trial"
  isExpired: boolean,              // true if expired
  source: string,                  // "customClaims" or "firestore" or "firestore-notfound"
  error?: string                   // error message if check failed
}
```

## Required Firestore Structure

For Firestore-based subscription checking to work, ensure this document exists:

```
Collection: users
Document: {user.uid}
Field: subscription
  ├── expiryDate: (ISO string or Timestamp)
  ├── plan: "annual" | "monthly" | "trial"
  └── status: "active" | "expired" | "cancelled"
```

### Example Firestore Document

```json
{
  "id": "user123",
  "email": "user@example.com",
  "subscription": {
    "expiryDate": "2025-12-31T23:59:59Z",
    "plan": "annual",
    "status": "active"
  }
}
```

## Files Modified

1. **firebase.js**
   - Added Firestore initialization
   - Exported `db` instance

2. **context/AuthContext.js**
   - Added `checkSubscriptionStatus()` function
   - Implements two-tier subscription checking
   - Returns comprehensive subscription data

3. **App.js**
   - Added subscription check on user login
   - Dynamic `initialRouteName` based on subscription status
   - Routes to Home or TrialOffer accordingly

4. **screen/LoginScreen.js**
   - Added comment explaining automatic navigation

## Testing

### Test with Firestore (No Backend Required)

1. Create/sign up a user
2. Manually add subscription document in Firestore:
   ```
   users/{userId}/subscription = {
     expiryDate: "2025-12-31T23:59:59Z",
     plan: "annual",
     status: "active"
   }
   ```
3. Sign out and sign back in
4. Should navigate to Home screen

### Test Trial Offer Navigation

1. Create/sign up a user WITHOUT subscription document
2. Sign out and sign back in
3. Should navigate to Trial Offer screen

### Test Expired Subscription

1. Create user with subscription
2. Set `expiryDate` to past date (e.g., "2020-01-01")
3. Sign out and sign back in
4. Should navigate to Trial Offer screen

## Production Setup

For production, implement the backend:

1. **Set Custom Claims after payment**
   - When user purchases subscription
   - Backend Cloud Function sets `subscriptionExpiry` claim
   - Faster, more secure than Firestore

2. **Or use Firestore + Backend**
   - Backend writes subscription data to Firestore
   - App reads from Firestore as fallback
   - More reliable than custom claims alone

3. **Sync subscription expiry**
   - Webhook from payment processor (Stripe, RevenueCat, etc.)
   - Updates Firebase custom claims and/or Firestore
   - App fetches updated claims on each sign in
