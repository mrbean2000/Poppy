import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const googleClientIds = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export const hasGoogleConfiguration = Boolean(
  googleClientIds.iosClientId &&
  googleClientIds.androidClientId &&
  googleClientIds.webClientId,
);

export default function GoogleSignInButton({
  disabled,
  containerStyle,
  textStyle,
  iconStyle,
  onStart,
  onFinish,
  onError,
}) {
  const { auth } = useAuth();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
  });

  async function handleGoogleSignIn() {
    if (!request || disabled) return;
    onStart();
    try {
      const response = await promptAsync();
      if (response.type !== "success") return;
      const idToken = response.params?.id_token;
      if (!idToken) {
        throw new Error("Google did not return an ID token.");
      }
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    } catch (error) {
      onError(error);
    } finally {
      onFinish();
    }
  }

  if (!hasGoogleConfiguration) return null;

  return (
    <TouchableOpacity
      style={[styles.providerButton, containerStyle]}
      onPress={handleGoogleSignIn}
      disabled={disabled || !request}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
    >
      <MaterialCommunityIcons
        name="google"
        size={26}
        color="#4285F4"
        style={iconStyle}
      />
      <Text style={[styles.providerButtonText, textStyle]}>
        Continue with Google
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  providerButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  providerButtonText: {
    marginLeft: 10,
    color: "#172033",
    fontSize: 14,
    fontWeight: "800",
  },
});
