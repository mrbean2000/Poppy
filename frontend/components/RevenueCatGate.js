import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "../context/AuthContext";

const entitlementId = "premium";
let configured = false;
let identityQueue = Promise.resolve();

function identifyUser(uid) {
  const operation = identityQueue.then(async () => {
    const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    if (!apiKey || !apiKey.startsWith("appl_")) {
      throw new Error(
        "Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY to your RevenueCat Apple public SDK key.",
      );
    }

    if (!configured) {
      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey, appUserID: uid });
      configured = true;
    } else if ((await Purchases.getAppUserID()) !== uid) {
      await Purchases.logIn(uid);
    }
    return Purchases.getCustomerInfo();
  });
  identityQueue = operation.catch(() => {});
  return operation;
}

export default function RevenueCatGate({ user, children }) {
  const { signOut } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  const presenting = useRef(false);
  const initialized = useRef(false);
  const autoPresented = useRef(false);

  const updateAccess = useCallback((customerInfo) => {
    if (!mounted.current) return;
    setStatus(customerInfo.entitlements.active[entitlementId] ? "active" : "inactive");
  }, []);

  useEffect(() => {
    mounted.current = true;
    SplashScreen.hideAsync().catch((error) =>
      console.warn("Unable to hide the native splash screen:", error),
    );
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    initialized.current = false;
    setStatus("loading");
    setMessage(null);
    identifyUser(user.uid)
      .then((customerInfo) => {
        if (!current) return;
        initialized.current = true;
        updateAccess(customerInfo);
      })
      .catch((error) => {
        console.warn("RevenueCat initialization failed:", error);
        if (current) {
          setMessage(error.message || "Unable to check your subscription.");
          setStatus("error");
        }
      });
    return () => {
      current = false;
    };
  }, [user.uid, attempt, updateAccess]);

  useEffect(() => {
    if (status === "loading" || status === "error") return undefined;
    const onCustomerInfo = async () => {
      try {
        if (initialized.current && (await Purchases.getAppUserID()) === user.uid) {
          const customerInfo = await Purchases.getCustomerInfo();
          if ((await Purchases.getAppUserID()) === user.uid) updateAccess(customerInfo);
        }
      } catch (error) {
        console.warn("Unable to verify RevenueCat customer:", error);
        if (mounted.current) {
          setMessage("Unable to verify your subscription. Please retry.");
          setStatus("error");
        }
      }
    };
    const onAppState = async (nextState) => {
      if (nextState !== "active" || presenting.current) return;
      try {
        if ((await Purchases.getAppUserID()) !== user.uid) {
          throw new Error("RevenueCat customer does not match the signed-in user.");
        }
        updateAccess(await Purchases.getCustomerInfo());
      } catch (error) {
        console.warn("Unable to refresh subscription:", error);
        if (mounted.current) {
          setMessage("Unable to refresh your subscription. Please retry.");
          setStatus("error");
        }
      }
    };
    Purchases.addCustomerInfoUpdateListener(onCustomerInfo);
    const subscription = AppState.addEventListener("change", onAppState);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfo);
      subscription.remove();
    };
  }, [status, updateAccess, user.uid]);

  const showPaywall = useCallback(async () => {
    if (presenting.current || !initialized.current) return;
    presenting.current = true;
    setBusy(true);
    setMessage(null);
    try {
      if ((await Purchases.getAppUserID()) !== user.uid) {
        throw new Error("RevenueCat customer does not match the signed-in user.");
      }
      const offerings = await Purchases.getOfferings();
      if (!offerings.current || offerings.current.availablePackages.length === 0) {
        throw new Error("No current RevenueCat offering with available packages was found.");
      }
      const result = await RevenueCatUI.presentPaywall({
        offering: offerings.current,
        displayCloseButton: true,
      });
      if (result === PAYWALL_RESULT.ERROR || result === PAYWALL_RESULT.NOT_PRESENTED) {
        throw new Error("The RevenueCat paywall could not be displayed.");
      }
      const customerInfo = await Purchases.getCustomerInfo();
      if ((await Purchases.getAppUserID()) !== user.uid) {
        throw new Error("RevenueCat customer changed while the paywall was open.");
      }
      updateAccess(customerInfo);
      if (
        mounted.current &&
        (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) &&
        !customerInfo.entitlements.active[entitlementId]
      ) {
        setMessage("No active premium entitlement was found. Check the product's entitlement configuration.");
      }
    } catch (error) {
      console.warn("Unable to display RevenueCat paywall:", error);
      if (mounted.current) setMessage(error.message || "Unable to display the paywall.");
    } finally {
      presenting.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [updateAccess, user.uid]);

  useEffect(() => {
    if (status === "inactive" && !autoPresented.current) {
      autoPresented.current = true;
      showPaywall();
    }
  }, [showPaywall, status]);

  const restore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if ((await Purchases.getAppUserID()) !== user.uid) {
        throw new Error("RevenueCat customer does not match the signed-in user.");
      }
      const customerInfo = await Purchases.restorePurchases();
      if ((await Purchases.getAppUserID()) !== user.uid) {
        throw new Error("RevenueCat customer changed while restoring purchases.");
      }
      updateAccess(customerInfo);
      if (!customerInfo.entitlements.active[entitlementId]) {
        setMessage("No active subscription was found to restore.");
      }
    } catch (error) {
      console.warn("Unable to restore purchases:", error);
      if (mounted.current) setMessage(error.message || "Unable to restore purchases.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } catch (error) {
      console.warn("Unable to sign out:", error);
      if (mounted.current) {
        setMessage(error.message || "Unable to sign out.");
        setBusy(false);
      }
    }
  };

  if (status === "active") return children;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Poppy Premium</Text>
        {status === "loading" ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <Text style={styles.description}>
              {status === "inactive"
                ? "A subscription is required to continue."
                : "We could not check your subscription."}
            </Text>
            {message ? <Text style={styles.error}>{message}</Text> : null}
            {status === "error" ? (
              <TouchableOpacity style={styles.button} disabled={busy} onPress={() => setAttempt((value) => value + 1)}>
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.button} disabled={busy} onPress={showPaywall}>
                  <Text style={styles.buttonText}>View subscription options</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.link} disabled={busy} onPress={restore}>
                  <Text style={styles.linkText}>Restore purchases</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.link} disabled={busy} onPress={handleSignOut}>
              <Text style={styles.linkText}>Sign out</Text>
            </TouchableOpacity>
            {busy ? <ActivityIndicator /> : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F1E8" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#203B32", marginBottom: 16 },
  description: { fontSize: 16, color: "#3D414A", textAlign: "center", marginBottom: 16 },
  error: { color: "#B42318", textAlign: "center", marginBottom: 16 },
  button: { backgroundColor: "#2F80ED", borderRadius: 16, padding: 16, marginBottom: 8 },
  buttonText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  link: { padding: 12 },
  linkText: { color: "#203B32", fontWeight: "600" },
});
