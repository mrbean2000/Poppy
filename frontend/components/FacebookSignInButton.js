import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

export default function FacebookSignInButton({
  disabled,
  busy,
  containerStyle,
  textStyle,
  onStart,
  onFinish,
  onError,
}) {
  const { auth } = useAuth();
  const [request, , promptAsync] = Facebook.useAuthRequest({
    clientId: facebookAppId || "",
  });

  async function handleFacebookSignIn() {
    if (disabled) return;
    if (!facebookAppId || !request) {
      onError(new Error("Facebook sign-in is not configured for this app."));
      return;
    }

    onStart();
    try {
      const response = await promptAsync();
      if (response.type === "error") {
        throw new Error(response.error?.message || "Facebook sign-in failed.");
      }
      if (response.type !== "success") return;
      const accessToken =
        response.authentication?.accessToken || response.params?.access_token;
      if (!accessToken) {
        throw new Error("Facebook did not return an access token.");
      }
      await signInWithCredential(
        auth,
        FacebookAuthProvider.credential(accessToken),
      );
    } catch (error) {
      onError(error);
    } finally {
      onFinish();
    }
  }

  return (
    <TouchableOpacity
      style={[styles.button, containerStyle]}
      onPress={handleFacebookSignIn}
      disabled={disabled}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel="Continue with Facebook"
    >
      {busy ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <MaterialCommunityIcons name="facebook" size={26} color="#FFFFFF" />
          <Text style={[styles.text, textStyle]} numberOfLines={1}>
            Continue with Facebook
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#1687F8",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
