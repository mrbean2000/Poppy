import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase";
import { MOCK_SUBSCRIPTIONS } from "../mocks/mockSubscriptions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) return undefined;

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthError(null);
        setIsLoading(false);
      },
      (error) => {
        setUser(null);
        setAuthError(error.message);
        setIsLoading(false);
      },
    );
  }, []);

  const value = useMemo(
    () => ({
      auth,
      user,
      isLoading,
      authError,
      isFirebaseConfigured,
      signInWithEmail: (email, password) => {
        if (!auth) throw new Error("Firebase is not configured.");
        return signInWithEmailAndPassword(auth, email.trim(), password);
      },
      createAccount: (email, password) => {
        if (!auth) throw new Error("Firebase is not configured.");
        return createUserWithEmailAndPassword(auth, email.trim(), password);
      },
      sendPasswordReset: (email) => {
        if (!auth) throw new Error("Firebase is not configured.");
        return sendPasswordResetEmail(auth, email.trim());
      },
      signOut: () => {
        if (!auth) throw new Error("Firebase is not configured.");
        return firebaseSignOut(auth);
      },
      checkSubscriptionStatus: async () => {
        if (!user) return { hasActiveSubscription: false };

        if (__DEV__ && user.uid in MOCK_SUBSCRIPTIONS) {
          const mock = MOCK_SUBSCRIPTIONS[user.uid];
          if (!mock) return { hasActiveSubscription: false, source: "mock" };
          const subscriptionExpiry = mock.expiryDate();
          const hasActiveSubscription =
            new Date(subscriptionExpiry).getTime() > Date.now();
          return {
            hasActiveSubscription,
            subscriptionExpiry,
            subscriptionPlan: mock.plan,
            isExpired: !hasActiveSubscription,
            source: "mock",
          };
        }

        if (!db) return { hasActiveSubscription: false };
        try {
          // Check custom claims first (backend-set subscription)
          const idTokenResult = await user.getIdTokenResult(true);
          const customClaims = idTokenResult.claims || {};
          const subscriptionExpiry = customClaims.subscriptionExpiry;
          
          if (subscriptionExpiry) {
            const now = new Date().getTime();
            const expiryTime = new Date(subscriptionExpiry).getTime();
            const hasActiveSubscription = expiryTime > now;
            
            return { 
              hasActiveSubscription, 
              subscriptionExpiry,
              isExpired: !hasActiveSubscription,
              source: "customClaims"
            };
          }

          // Fallback to Firestore if no custom claims
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getDoc(userDocRef);
          
          if (!userDocSnapshot.exists()) {
            return { hasActiveSubscription: false, source: "firestore-notfound" };
          }

          const userData = userDocSnapshot.data();
          const subscriptionData = userData?.subscription;
          
          // If no subscription data exists
          if (!subscriptionData || !subscriptionData.expiryDate) {
            return { hasActiveSubscription: false, source: "firestore-noexpiry" };
          }

          // Check if subscription has expired
          const now = new Date().getTime();
          let expiryTime;
          
          if (typeof subscriptionData.expiryDate === "string") {
            expiryTime = new Date(subscriptionData.expiryDate).getTime();
          } else if (subscriptionData.expiryDate?.toDate) {
            // Firestore Timestamp
            expiryTime = subscriptionData.expiryDate.toDate().getTime();
          } else {
            expiryTime = subscriptionData.expiryDate.getTime();
          }

          const hasActiveSubscription = expiryTime > now;
          
          return { 
            hasActiveSubscription,
            subscriptionExpiry: subscriptionData.expiryDate,
            subscriptionPlan: subscriptionData.plan, // "annual" or "monthly"
            isExpired: !hasActiveSubscription,
            source: "firestore"
          };
        } catch (error) {
          console.warn("Error checking subscription:", error);
          // Default to no subscription if there's an error
          return { hasActiveSubscription: false, error: error.message };
        }
      },
    }),
    [user, isLoading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
