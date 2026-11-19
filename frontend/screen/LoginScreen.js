import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { OAuthProvider, signInWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import GoogleSignInButton, {
  hasGoogleConfiguration,
} from "../components/GoogleSignInButton";
import FacebookSignInButton from "../components/FacebookSignInButton";
import friendlyAuthError from "../util/friendlyAuthError";

const welcomeMascotImages = [
  require("../assets/images/masot/poppy_raincoat.jpeg"),
  require("../assets/images/masot/poppy_podcast.png"),
  require("../assets/images/masot/poppy_music.png"),
];

export default function LoginScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const {
    auth,
    authError,
    isFirebaseConfigured,
    signInWithEmail,
    sendPasswordReset,
  } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeMascot, setWelcomeMascot] = useState(
    () =>
      welcomeMascotImages[
        Math.floor(Math.random() * welcomeMascotImages.length)
      ],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const titleFontSize = Math.min(42, Math.max(32, width * 0.102));
  const compactLayout = height < 750;
  const screenTransition = useRef(new Animated.Value(1)).current;
  const transitionDirection = useRef(1);
  const transitionAnimation = useRef(null);
  const resetInProgress = useRef(false);

  function animateScreenChange(updateScreen, direction, duration = 240) {
    transitionAnimation.current?.stop();
    transitionDirection.current = direction;
    screenTransition.setValue(0);
    updateScreen();
    transitionAnimation.current = Animated.timing(screenTransition, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });
    transitionAnimation.current.start();
  }

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "ios") return undefined;
    let isCurrent = true;
    AppleAuthentication.isAvailableAsync().then((available) => {
      if (isCurrent) setAppleAvailable(available);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleEmailSubmit() {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setIsBusy(true);
    try {
      await signInWithEmail(email, password);
      transitionDirection.current = 0;
      screenTransition.setValue(1);
      transitionAnimation.current = Animated.timing(screenTransition, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      });
      transitionAnimation.current.start();
      // Note: Navigation is handled by App.js based on user state
      // After successful sign-in, the app will check subscription status
      // and navigate to TrialOffer or Home via the onAuthStateChanged listener
    } catch (error) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAppleSignIn() {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) {
        throw new Error("Apple did not return an identity token.");
      }

      const provider = new OAuthProvider("apple.com");
      const firebaseCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
      await signInWithCredential(auth, firebaseCredential);
    } catch (error) {
      if (error?.code !== "ERR_REQUEST_CANCELED") {
        setErrorMessage(friendlyAuthError(error));
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (resetInProgress.current || !isFirebaseConfigured) return;
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage("Enter your email address.");
      return;
    }
    resetInProgress.current = true;
    setIsBusy(true);
    const showConfirmation = () => {
      Keyboard.dismiss();
      Alert.alert(
        "Check your email",
        "If an account exists for this email, you may receive a password reset link. Check your spam folder too.",
      );
    };
    try {
      await sendPasswordReset(email);
      showConfirmation();
    } catch (error) {
      if (error?.code === "auth/user-not-found") {
        showConfirmation();
      } else {
        setErrorMessage(friendlyAuthError(error));
      }
    } finally {
      resetInProgress.current = false;
      setIsBusy(false);
    }
  }

  function returnToSignIn() {
    Keyboard.dismiss();
    setErrorMessage(null);
    setShowPasswordReset(false);
  }

  const transitionStyle = {
    opacity: screenTransition.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    }),
    transform: [
      {
        translateX: screenTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [transitionDirection.current * 24, 0],
        }),
      },
    ],
  };

  if (showWelcome) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.welcomeSafeArea]}>
        {/* <ImageBackground
          source={require("../assets/images/masot/poppy_loadingscreen.png")}
          style={styles.loginBackground}
          imageStyle={styles.loginBackgroundImage}
          resizeMode="cover"
          accessible={false}
        /> */}
        <Animated.View style={[styles.transitionLayer, transitionStyle]}>
          <ScrollView contentContainerStyle={styles.welcomeScreen}>
            <View style={styles.welcomeHero}>
              <View style={styles.welcomeImageWrapper}>
                <Image
                  source={require("../assets/images/masot/poppy_loadingscreen.png")}
                  style={[
                    styles.welcomeHeroImage,
                    compactLayout && styles.compactWelcomeHeroImage,
                  ]}
                  resizeMode="cover"
                  accessible={false}
                />
                <Svg
                  width={compactLayout ? 57 : 90}
                  height={compactLayout ? 57 : 90}
                  viewBox="0 0 90 90"
                  style={styles.welcomeScribble}
                  pointerEvents="none"
                  accessible={false}
                >
                  <Path
                    d="M5 25 L25 5 L10 33 L32 9 L15 40 L39 14 L21 47 L45 20 L28 53 L52 27 L35 60 L59 34 L42 67 L66 41 L49 74 L73 48 L56 81 L80 55"
                    fill="none"
                    stroke="#1ED760"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.welcomeTitle}>
                Have fun learning.{"\n\n"}
                From your favorite Stories and Podcasts.
              </Text>
            </View>

            <View style={styles.welcomeActions}>
              <TouchableOpacity
                style={styles.welcomePrimaryButton}
                onPress={() =>
                  navigation.navigate("OnboardingLearningLanguageScreen")
                }
                accessibilityRole="button"
                accessibilityLabel="Get started and create an account"
              >
                <Text style={styles.welcomePrimaryText}>Get started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.welcomeSecondaryButton}
                onPress={() =>
                  animateScreenChange(
                    () => {
                      setErrorMessage(null);
                      setShowWelcome(false);
                    },
                    1,
                    420,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="I already have an account"
              >
                <Text style={styles.welcomeSecondaryText}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (showPasswordReset) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* <ImageBackground
          source={require("../assets/images/masot/backgroundimagequestion.png")}
          style={styles.loginBackground}
          imageStyle={styles.loginBackgroundImage}
          resizeMode="cover"
          accessible={false}
        /> */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.welcomeBackButton}
              onPress={returnToSignIn}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#203B32"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            <View style={styles.formContent}>
              <Text
                style={[
                  styles.title,
                  { fontSize: titleFontSize, lineHeight: titleFontSize * 1.1 },
                ]}
              >
                Reset password
              </Text>
              <Text style={styles.resetDescription}>
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={24}
                  color="#805B3E"
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#A98768"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handlePasswordReset}
                  editable={true}
                  accessibilityLabel="Email address"
                />
              </View>
              {errorMessage ? (
                <Text
                  accessibilityRole="alert"
                  style={[styles.error, { color: theme.colors.danger }]}
                >
                  {errorMessage}
                </Text>
              ) : null}
              {!isFirebaseConfigured ? (
                <Text style={[styles.error, { color: theme.colors.danger }]}>
                  Firebase is not configured. Configure it before resetting your
                  password.
                </Text>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.colors.primary },
                  (!isFirebaseConfigured || isBusy) && styles.disabledButton,
                ]}
                onPress={handlePasswordReset}
                disabled={!isFirebaseConfigured || isBusy}
                accessibilityRole="button"
                accessibilityLabel="Send password reset link"
              >
                {isBusy ? (
                  <ActivityIndicator color={theme.colors.primaryText} />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: theme.colors.primaryText },
                    ]}
                  >
                    Send reset link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea]}>
      {/* <ImageBackground
        source={require("../assets/images/masot/backgroundimagequestion.png")}
        style={styles.loginBackground}
        imageStyle={styles.loginBackgroundImage}
        resizeMode="cover"
        accessible={false}
      /> */}
      <Animated.View style={[styles.transitionLayer, transitionStyle]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.welcomeBackButton}
              onPress={() =>
                animateScreenChange(() => {
                  setWelcomeMascot(
                    welcomeMascotImages[
                      Math.floor(Math.random() * welcomeMascotImages.length)
                    ],
                  );
                  setShowWelcome(true);
                }, -1)
              }
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Back to welcome screen"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color="#203B32"
              />
            </TouchableOpacity>
          </View>
          <View
            style={[styles.content, compactLayout && styles.compactContent]}
          >
            <View style={styles.formContent}>
              <View
                style={[styles.heading, compactLayout && styles.compactHeading]}
              >
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: titleFontSize,
                      lineHeight: titleFontSize * 1.1,
                      color: "#153D32",
                    },
                  ]}
                >
                  Welcome back
                </Text>

                {!isFirebaseConfigured ? (
                  <View
                    style={[
                      styles.configurationNotice,
                      { backgroundColor: theme.colors.orangePastel },
                    ]}
                  >
                    <Text
                      style={[
                        styles.configurationText,
                        { color: theme.colors.text },
                      ]}
                    >
                      Firebase is not configured. Add the Firebase values from
                      your project to frontend/.env before signing in.
                    </Text>
                  </View>
                ) : null}
                {authError ? (
                  <Text style={[styles.error, { color: theme.colors.danger }]}>
                    {authError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.formActions}>
                <View style={styles.form}>
                  <View
                    style={[
                      styles.inputRow,
                      compactLayout && styles.compactInputRow,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={24}
                      color="#805B3E"
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Email address"
                      placeholderTextColor="#A98768"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      textContentType="emailAddress"
                      editable={true}
                      accessibilityLabel="Email address"
                    />
                  </View>

                  <View
                    style={[
                      styles.inputRow,
                      compactLayout && styles.compactInputRow,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={24}
                      color="#805B3E"
                    />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor="#A98768"
                      secureTextEntry={!isPasswordVisible}
                      autoComplete="current-password"
                      textContentType="password"
                      editable={true}
                      accessibilityLabel="Password"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      <MaterialCommunityIcons
                        name={
                          isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        size={24}
                        color="#805B3E"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setErrorMessage(null);
                      setShowPasswordReset(true);
                    }}
                    disabled={!isFirebaseConfigured || isBusy}
                    accessibilityRole="button"
                  >
                    <Text style={styles.link}>Forgot password?</Text>
                  </TouchableOpacity>

                  {errorMessage ? (
                    <Text
                      style={[styles.error, { color: theme.colors.danger }]}
                    >
                      {errorMessage}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      compactLayout && styles.compactButton,
                      { backgroundColor: theme.colors.primary },
                      (!isFirebaseConfigured || isBusy) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleEmailSubmit}
                    disabled={!isFirebaseConfigured || isBusy}
                    accessibilityRole="button"
                  >
                    {isBusy ? (
                      <ActivityIndicator color={theme.colors.primaryText} />
                    ) : (
                      <Text
                        style={[
                          styles.submitButtonText,
                          { color: theme.colors.primaryText },
                        ]}
                      >
                        Sign in
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {!keyboardVisible && (
                  <View>
                    <View
                      style={[
                        styles.dividerRow,
                        compactLayout && styles.compactDividerRow,
                      ]}
                    >
                      <View style={styles.divider} />
                      <Text style={styles.orText}>OR CONTINUE WITH</Text>
                      <View style={styles.divider} />
                    </View>

                    {hasGoogleConfiguration ? (
                      <GoogleSignInButton
                        disabled={!isFirebaseConfigured || isBusy}
                        containerStyle={[
                          styles.googleProviderButton,
                          compactLayout && styles.compactButton,
                        ]}
                        textStyle={styles.providerButtonText}
                        iconStyle={styles.providerIcon}
                        onStart={() => {
                          setErrorMessage(null);
                          setIsBusy(true);
                        }}
                        onFinish={() => setIsBusy(false)}
                        onError={(error) =>
                          setErrorMessage(friendlyAuthError(error))
                        }
                      />
                    ) : (
                      <Text
                        style={[
                          styles.providerSetupHint,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Add the Google OAuth client IDs to enable Google
                        sign-in.
                      </Text>
                    )}

                    <FacebookSignInButton
                      disabled={!isFirebaseConfigured || isBusy}
                      busy={isBusy}
                      containerStyle={[
                        styles.facebookProviderButton,
                        compactLayout && styles.compactProviderButton,
                        (!isFirebaseConfigured || isBusy) &&
                          styles.disabledButton,
                      ]}
                      textStyle={styles.facebookProviderText}
                      onStart={() => {
                        setErrorMessage(null);
                        setIsBusy(true);
                      }}
                      onFinish={() => setIsBusy(false)}
                      onError={(error) =>
                        setErrorMessage(friendlyAuthError(error))
                      }
                    />

                    {Platform.OS === "ios" && isFirebaseConfigured ? (
                      appleAvailable ? (
                        <TouchableOpacity
                          style={[
                            styles.appleButton,
                            compactLayout && styles.compactProviderButton,
                          ]}
                          onPress={handleAppleSignIn}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="apple"
                            size={26}
                            color="#FFFFFF"
                          />
                          <Text style={styles.appleButtonText}>
                            Continue with Apple
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            styles.providerSetupHint,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Apple sign-in is available on supported Apple devices.
                        </Text>
                      )
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  welcomeSafeArea: { backgroundColor: "#000000" },
  loginBackground: {
    ...StyleSheet.absoluteFill,
  },
  loginBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  flex: { flex: 1 },
  transitionLayer: { flex: 1 },
  topBar: {
    width: "100%",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  welcomeScreen: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  welcomeHero: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  welcomeImageWrapper: {
    position: "relative",
  },
  welcomeScribble: {
    position: "absolute",
    top: -12,
    right: -18,
  },
  welcomeHeroImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  compactWelcomeHeroImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  welcomeMascot: {
    width: "90%",
    maxWidth: 320,
    height: 290,
  },
  welcomeTitle: {
    maxWidth: 420,
    marginTop: 24,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 38,
    textAlign: "center",
  },
  welcomeSubtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
  },
  welcomeActions: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    gap: 12,
  },
  welcomePrimaryButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1ED760",
  },
  welcomePrimaryText: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  welcomeSecondaryButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    borderColor: "#727272",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  welcomeSecondaryText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  welcomeBackButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFCF5",
    borderWidth: 2,
    borderColor: "#F9D96F",
    elevation: 3,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  compactContent: { paddingVertical: 4 },
  formContent: {
    width: "100%",
    maxWidth: 460,
  },
  heading: { width: "100%", marginBottom: 24 },
  compactHeading: { marginBottom: 8 },
  formActions: { width: "100%" },
  brandIcon: {
    width: 70,
    height: 70,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    borderRadius: 22,
    backgroundColor: "#E5F5D5",
  },
  title: {
    marginBottom: 10,
    color: "#153D32",
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -1,
    includeFontPadding: false,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 6,
    color: "#153D32",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "400",
    includeFontPadding: false,
    textAlign: "center",
  },
  resetDescription: {
    color: "#153D32",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 24,
    textAlign: "center",
  },
  configurationNotice: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
  },
  configurationText: { fontSize: 13, lineHeight: 19 },
  form: { width: "100%" },
  inputRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E2D6C7",
    borderRadius: 16,
    backgroundColor: "#FFFDF9",
  },
  compactInputRow: { marginBottom: 6 },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 14,
    color: "#493321",
    fontSize: 16,
  },
  forgotButton: { alignSelf: "flex-end", marginTop: -4, marginBottom: 17 },
  link: { color: "#1687F8", fontSize: 16, fontWeight: "700" },
  error: { marginTop: 12, marginBottom: 12, fontSize: 13, lineHeight: 19 },
  submitButton: {
    minHeight: 66,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    borderRadius: 23,
  },
  compactButton: { minHeight: 48 },
  disabledButton: { opacity: 0.5 },
  submitButtonText: { fontSize: 18, fontWeight: "700" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  compactDividerRow: { marginTop: 12, marginBottom: 8 },
  divider: { flex: 1, height: 1, backgroundColor: "#B8B7A3" },
  orText: {
    marginHorizontal: 10,
    color: "#153D32",
    fontSize: 10,
    fontWeight: "800",
  },
  providerSetupHint: {
    marginVertical: 0,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  googleProviderButton: {
    minHeight: 66,
    marginBottom: 0,
    borderColor: "#9BA99A",
    borderRadius: 23,
    backgroundColor: "#FFFEFA",
  },
  facebookProviderButton: {
    minHeight: 66,
    marginTop: 16,
    borderRadius: 23,
  },
  compactProviderButton: { minHeight: 48, marginTop: 8 },
  facebookProviderText: { fontSize: 18, fontWeight: "700" },
  providerButtonText: {
    color: "#153D32",
    fontSize: 18,
    fontWeight: "700",
  },
  providerIcon: { fontSize: 26 },
  appleButton: {
    width: "100%",
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 23,
    backgroundColor: "#000000",
  },
  appleButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    gap: 4,
  },
  switchText: {
    color: "#153D32",
    fontSize: 16,
    fontWeight: "600",
  },
});
