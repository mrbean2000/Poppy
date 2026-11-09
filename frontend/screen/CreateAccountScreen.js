import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import GoogleSignInButton, {
  hasGoogleConfiguration,
} from "../components/GoogleSignInButton";
import FacebookSignInButton from "../components/FacebookSignInButton";
import friendlyAuthError from "../util/friendlyAuthError";
import { createUserProfile, createUserSettings } from "../util/http";

const dateMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const dateWheelRowHeight = 42;
const dateWheelHeight = 216;

function DateWheelColumn({ label, values, selectedIndex, onChange, style }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * dateWheelRowHeight,
      animated: false,
    });
  }, [selectedIndex, values.length]);

  return (
    <View style={[styles.dateWheelColumn, style]}>
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={dateWheelRowHeight}
        decelerationRate={0.85}
        scrollEventThrottle={16}
        contentContainerStyle={styles.dateWheelContent}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const index = Math.round(
            nativeEvent.contentOffset.y / dateWheelRowHeight,
          );
          onChange(Math.max(0, Math.min(values.length - 1, index)));
        }}
        accessibilityLabel={`${label} selector`}
      >
        {values.map((value, index) => {
          const distance = Math.abs(index - selectedIndex);
          const opacity = Math.max(0.3, 1 - distance * 0.15);

          return (
            <View key={`${label}-${value}`} style={styles.dateWheelItem}>
              <Text
                style={[
                  styles.dateWheelText,
                  { opacity },
                  index === selectedIndex && styles.dateWheelSelectedText,
                ]}
                numberOfLines={1}
              >
                {value}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function CreateAccountScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { auth, authError, isFirebaseConfigured, createAccount } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const emailFormOpacity = useRef(new Animated.Value(1)).current;
  const emailFormOffset = useRef(new Animated.Value(0)).current;
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: false,
    lastName: false,
    dateOfBirth: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const titleFontSize = Math.min(42, Math.max(32, width * 0.102));
  const providerLabelFontSize = 16;
  const currentYear = new Date().getFullYear();
  const dateYears = Array.from(
    { length: 101 },
    (_, index) => currentYear - 100 + index,
  );
  const dateDays = dateOfBirth
    ? new Date(
        dateOfBirth.getFullYear(),
        dateOfBirth.getMonth() + 1,
        0,
      ).getDate()
    : 31;

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

  function openEmailForm() {
    emailFormOpacity.setValue(0);
    emailFormOffset.setValue(20);
    setShowEmailForm(true);

    Animated.parallel([
      Animated.timing(emailFormOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(emailFormOffset, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeEmailForm() {
    emailFormOpacity.setValue(1);
    emailFormOffset.setValue(0);
    setErrorMessage(null);
    setShowEmailForm(false);
  }

  function toggleDatePicker() {
    if (!showDatePicker && !dateOfBirth) {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() - 18);
      setDateOfBirth(defaultDate);
    }
    setShowDatePicker((visible) => !visible);
  }

  function handleFirstNameChange(text) {
    setFirstName(text);
    if (fieldErrors.firstName && text.trim()) {
      setFieldErrors((prev) => ({ ...prev, firstName: false }));
    }
  }

  function handleLastNameChange(text) {
    setLastName(text);
    if (fieldErrors.lastName && text.trim()) {
      setFieldErrors((prev) => ({ ...prev, lastName: false }));
    }
  }

  function handleEmailChange(text) {
    setEmail(text);
    if (fieldErrors.email && text.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: false }));
    }
  }

  function handlePasswordChange(text) {
    setPassword(text);
    if (fieldErrors.password && text) {
      setFieldErrors((prev) => ({ ...prev, password: false }));
    }
  }

  function handleConfirmPasswordChange(text) {
    setConfirmPassword(text);
    if (fieldErrors.confirmPassword && text) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: false }));
    }
  }

  function updateDateOfBirth(part, value) {
    setDateOfBirth((currentDate) => {
      const nextDate = new Date(currentDate);
      const year = nextDate.getFullYear();
      const month = nextDate.getMonth();
      const day = nextDate.getDate();

      if (part === "day") {
        return new Date(year, month, value + 1);
      }
      if (part === "month") {
        const nextDay = Math.min(day, new Date(year, value + 1, 0).getDate());
        return new Date(year, value, nextDay);
      }

      const nextDay = Math.min(day, new Date(value, month + 1, 0).getDate());
      return new Date(value, month, nextDay);
    });
    // Clear the dateOfBirth error when user selects a date
    if (fieldErrors.dateOfBirth) {
      setFieldErrors((prev) => ({ ...prev, dateOfBirth: false }));
    }
  }

  async function handleEmailSubmit() {
    setErrorMessage(null);
    const errors = {
      firstName: !firstName.trim(),
      lastName: !lastName.trim(),
      dateOfBirth: !dateOfBirth,
      email: !email.trim(),
      password: !password,
      confirmPassword: !confirmPassword,
    };

    if (
      errors.firstName ||
      errors.lastName ||
      errors.dateOfBirth ||
      errors.email ||
      errors.password ||
      errors.confirmPassword
    ) {
      setFieldErrors(errors);
      const missingFields = [];
      if (errors.firstName) missingFields.push("First name");
      if (errors.lastName) missingFields.push("Last name");
      if (errors.dateOfBirth) missingFields.push("Date of birth");
      if (errors.email) missingFields.push("Email");
      if (errors.password) missingFields.push("Password");
      if (errors.confirmPassword) missingFields.push("Confirm password");
      setErrorMessage(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        password: true,
        confirmPassword: true,
      }));
      setErrorMessage("The passwords do not match.");
      return;
    }

    setFieldErrors({
      firstName: false,
      lastName: false,
      dateOfBirth: false,
      email: false,
      password: false,
      confirmPassword: false,
    });

    setIsBusy(true);
    try {
      await createAccount(email, password);
      const firebaseUid = auth.currentUser?.uid;
      if (!firebaseUid) {
        throw new Error("The account was created without a Firebase user ID.");
      }
      const formattedDateOfBirth = [
        dateOfBirth.getFullYear(),
        String(dateOfBirth.getMonth() + 1).padStart(2, "0"),
        String(dateOfBirth.getDate()).padStart(2, "0"),
      ].join("-");
      const profile = await createUserProfile({
        firebaseUid,
        email,
        firstName,
        lastName,
        dateOfBirth: formattedDateOfBirth,
      });
      if (!profile?.id) {
        throw new Error("The user profile was created without a database ID.");
      }
      await createUserSettings({
        user_id: profile.id,
        darkmode: false,
        nativelanguageid: route.params?.nativeLanguage?.id ?? 0,
        targetlanguageid: route.params?.selectedLearningLanguage?.id ?? 0,
        dailyReadingGoal: route.params?.dailyReadingGoal ?? null,
        dailyListeningGoal: route.params?.dailyListeningGoal ?? null,
        dateOfBirth: formattedDateOfBirth,
        practiceRemindersEnabled:
          route.params?.practiceRemindersEnabled ?? false,
      });
      Animated.parallel([
        Animated.timing(emailFormOpacity, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(emailFormOffset, {
          toValue: -20,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => navigation.navigate("TrialOffer"));
    } catch (error) {
      setErrorMessage(friendlyAuthError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAppleSignUp() {
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
        throw new Error("Apple did not return an ID token.");
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

  return (
    <ImageBackground
      source={require("../assets/images/masot/backgroundimagequestion.png")}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      accessible={false}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                if (showEmailForm) {
                  closeEmailForm();
                } else {
                  navigation.goBack();
                }
              }}
              disabled={isBusy}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={
                showEmailForm ? "Back to sign-in methods" : "Back"
              }
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color="#203B32"
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContent}>
              <View style={styles.heading}>
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: titleFontSize,
                      lineHeight: titleFontSize * 1.1,
                    },
                  ]}
                >
                  Create your account
                </Text>
                {!isFirebaseConfigured ? (
                  <View
                    style={[
                      styles.configurationNotice,
                      { backgroundColor: theme.colors.orangePastel },
                    ]}
                  >
                    <Text
                      style={[styles.noticeText, { color: theme.colors.text }]}
                    >
                      Firebase is not configured. Add the Firebase values from
                      your project to frontend/.env before creating an account.
                    </Text>
                  </View>
                ) : null}
                {authError ? (
                  <Text style={[styles.error, { color: theme.colors.danger }]}>
                    {authError}
                  </Text>
                ) : null}
              </View>

              <Animated.View
                style={[
                  styles.formActions,
                  {
                    opacity: emailFormOpacity,
                    transform: [{ translateX: emailFormOffset }],
                  },
                ]}
              >
                {showEmailForm ? (
                  <View style={styles.emailForm}>
                    <View
                      style={[
                        styles.dateOfBirthRow,
                        fieldErrors.dateOfBirth && styles.dateOfBirthRowError,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.dateCalendarButton}
                        onPress={toggleDatePicker}
                        disabled={!isFirebaseConfigured || isBusy}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Open date picker"
                      >
                        <MaterialCommunityIcons
                          name="calendar-outline"
                          size={24}
                          color="#805B3E"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateFieldValue}
                        onPress={toggleDatePicker}
                        disabled={!isFirebaseConfigured || isBusy}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={
                          dateOfBirth
                            ? `Date of birth, ${dateOfBirth.getDate()} ${
                                dateMonths[dateOfBirth.getMonth()]
                              } ${dateOfBirth.getFullYear()}`
                            : "Select date of birth"
                        }
                      >
                        {dateOfBirth ? (
                          <>
                            <Text style={styles.dateFieldLabel}>
                              Date of birth
                            </Text>
                            <Text style={styles.dateFieldDate}>
                              {dateOfBirth.getDate()}{" "}
                              {dateMonths[dateOfBirth.getMonth()].slice(0, 3)}{" "}
                              {dateOfBirth.getFullYear()}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.dateFieldPlaceholder}>
                            Date of birth
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateInfoButton}
                        onPress={() =>
                          Alert.alert(
                            "Date of birth",
                            "Enter your date of birth, for example: 18 Feb 1995.",
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Date of birth format information"
                      >
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={25}
                          color="#5F687E"
                        />
                      </TouchableOpacity>
                    </View>
                    {showDatePicker && dateOfBirth ? (
                      <View style={styles.dateWheel}>
                        <View
                          pointerEvents="none"
                          style={styles.dateWheelSelectedBand}
                        />
                        <DateWheelColumn
                          label="Day"
                          values={Array.from(
                            { length: dateDays },
                            (_, index) => index + 1,
                          )}
                          selectedIndex={dateOfBirth.getDate() - 1}
                          onChange={(index) => updateDateOfBirth("day", index)}
                          style={styles.dateDayColumn}
                        />
                        <DateWheelColumn
                          label="Month"
                          values={dateMonths}
                          selectedIndex={dateOfBirth.getMonth()}
                          onChange={(index) =>
                            updateDateOfBirth("month", index)
                          }
                          style={styles.dateMonthColumn}
                        />
                        <DateWheelColumn
                          label="Year"
                          values={dateYears}
                          selectedIndex={
                            dateOfBirth.getFullYear() - (currentYear - 100)
                          }
                          onChange={(index) =>
                            updateDateOfBirth("year", dateYears[index])
                          }
                          style={styles.dateYearColumn}
                        />
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.inputRow,
                        fieldErrors.firstName && styles.inputRowError,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={24}
                        color="#805B3E"
                      />
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={handleFirstNameChange}
                        onFocus={() =>
                          showDatePicker && setShowDatePicker(false)
                        }
                        placeholder="First name"
                        placeholderTextColor="#A98768"
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="givenName"
                        editable={isFirebaseConfigured && !isBusy}
                        accessibilityLabel="First name"
                      />
                    </View>
                    <View
                      style={[
                        styles.inputRow,
                        fieldErrors.lastName && styles.inputRowError,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={24}
                        color="#805B3E"
                      />
                      <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={handleLastNameChange}
                        onFocus={() =>
                          showDatePicker && setShowDatePicker(false)
                        }
                        placeholder="Last name"
                        placeholderTextColor="#A98768"
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="familyName"
                        editable={isFirebaseConfigured && !isBusy}
                        accessibilityLabel="Last name"
                      />
                    </View>
                    <View
                      style={[
                        styles.inputRow,
                        fieldErrors.email && styles.inputRowError,
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
                        onChangeText={handleEmailChange}
                        onFocus={() =>
                          showDatePicker && setShowDatePicker(false)
                        }
                        placeholder="Email address"
                        placeholderTextColor="#A98768"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        textContentType="emailAddress"
                        editable={isFirebaseConfigured && !isBusy}
                        accessibilityLabel="Email address"
                      />
                    </View>
                    <View
                      style={[
                        styles.inputRow,
                        fieldErrors.password && styles.inputRowError,
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
                        onChangeText={handlePasswordChange}
                        onFocus={() =>
                          showDatePicker && setShowDatePicker(false)
                        }
                        placeholder="Password"
                        placeholderTextColor="#A98768"
                        secureTextEntry={!isPasswordVisible}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={isFirebaseConfigured && !isBusy}
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
                            isPasswordVisible
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={24}
                          color="#805B3E"
                        />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.inputRow,
                        fieldErrors.confirmPassword && styles.inputRowError,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="lock-check-outline"
                        size={24}
                        color="#805B3E"
                      />
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={handleConfirmPasswordChange}
                        onFocus={() =>
                          showDatePicker && setShowDatePicker(false)
                        }
                        placeholder="Confirm password"
                        placeholderTextColor="#A98768"
                        secureTextEntry={!isConfirmPasswordVisible}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        editable={isFirebaseConfigured && !isBusy}
                        accessibilityLabel="Confirm password"
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setIsConfirmPasswordVisible((visible) => !visible)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          isConfirmPasswordVisible
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        <MaterialCommunityIcons
                          name={
                            isConfirmPasswordVisible
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={24}
                          color="#805B3E"
                        />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.emailSubmitButton,
                        { backgroundColor: theme.colors.primary },
                        (!isFirebaseConfigured || isBusy) &&
                          styles.disabledButton,
                      ]}
                      onPress={handleEmailSubmit}
                      disabled={!isFirebaseConfigured || isBusy}
                      accessibilityRole="button"
                      accessibilityLabel="Create account with email"
                    >
                      {isBusy ? (
                        <ActivityIndicator color={theme.colors.primaryText} />
                      ) : (
                        <Text
                          style={[
                            styles.emailSubmitButtonText,
                            { color: theme.colors.primaryText },
                          ]}
                        >
                          Create account
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.providerStack}>
                    <FacebookSignInButton
                      containerStyle={[
                        styles.facebookButton,
                        (!isFirebaseConfigured || isBusy) &&
                          styles.disabledButton,
                      ]}
                      textStyle={[
                        styles.facebookButtonText,
                        { fontSize: providerLabelFontSize },
                      ]}
                      disabled={!isFirebaseConfigured || isBusy}
                      busy={isBusy}
                      onStart={() => {
                        setErrorMessage(null);
                        setIsBusy(true);
                      }}
                      onFinish={() => setIsBusy(false)}
                      onError={(error) =>
                        setErrorMessage(friendlyAuthError(error))
                      }
                    />

                    {hasGoogleConfiguration ? (
                      <GoogleSignInButton
                        disabled={!isFirebaseConfigured || isBusy}
                        containerStyle={styles.googleProviderButton}
                        textStyle={[
                          styles.providerButtonText,
                          { fontSize: providerLabelFontSize },
                        ]}
                        iconStyle={[
                          styles.providerIcon,
                          { fontSize: Math.min(26, width * 0.067) },
                        ]}
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
                        sign-up.
                      </Text>
                    )}

                    {Platform.OS === "ios" && isFirebaseConfigured ? (
                      appleAvailable ? (
                        <TouchableOpacity
                          style={[
                            styles.appleButton,
                            isBusy && styles.disabledButton,
                          ]}
                          onPress={handleAppleSignUp}
                          disabled={isBusy}
                          activeOpacity={0.78}
                          accessibilityRole="button"
                          accessibilityLabel="Continue with Apple"
                        >
                          {isBusy ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <>
                              <MaterialCommunityIcons
                                name="apple"
                                size={30}
                                color="#FFFFFF"
                              />
                              <Text style={styles.appleButtonText}>
                                Continue with Apple
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            styles.providerSetupHint,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Apple sign-up is available on supported Apple devices.
                        </Text>
                      )
                    ) : null}

                    <TouchableOpacity
                      style={styles.emailButton}
                      onPress={openEmailForm}
                      disabled={isBusy}
                      activeOpacity={0.78}
                      accessibilityRole="button"
                      accessibilityLabel="Sign up with Email"
                    >
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={26}
                        color="#153D32"
                      />
                      <Text
                        style={[
                          styles.emailButtonText,
                          { fontSize: providerLabelFontSize },
                        ]}
                        numberOfLines={1}
                      >
                        Sign up with Email
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {errorMessage ? (
                  <Text style={[styles.error, { color: theme.colors.danger }]}>
                    {errorMessage}
                  </Text>
                ) : null}
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  background: { flex: 1, width: "100%" },
  backgroundImage: { width: "100%", height: "100%" },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 30,
  },
  topBar: {
    width: "100%",
    maxWidth: 460,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  formContent: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 460,
    marginTop: "10%",
  },
  heading: { width: "100%", marginBottom: "10%", paddingBottom: "2%" },
  formActions: { width: "100%" },
  headerButton: {
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
    textAlign: "left",
  },
  configurationNotice: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
  },
  noticeText: { fontSize: 13, lineHeight: 19 },
  form: { width: "100%" },
  emailForm: { width: "100%", gap: "2%" },
  dateOfBirthRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 16,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "#E2D6C7",
    borderRadius: 16,
    backgroundColor: "#FFFDF9",
  },
  dateOfBirthRowError: {
    borderWidth: 1,
    borderColor: "#E74C3C",
    backgroundColor: "#FFF5F5",
  },
  dateFieldValue: {
    flex: 1,
    minHeight: 56,
    justifyContent: "center",
    paddingLeft: 14,
  },
  dateFieldPlaceholder: {
    color: "#493321",
    fontSize: 16,
    fontWeight: "400",
  },
  dateFieldLabel: {
    color: "#493321",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
  },
  dateFieldDate: {
    color: "#493321",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
  },
  dateInfoButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCalendarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 10,
  },
  dateWheel: {
    height: dateWheelHeight,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#FEFCF8",
  },
  dateWheelColumn: {
    flex: 1,
    height: dateWheelHeight,
    overflow: "hidden",
  },
  dateDayColumn: { flex: 0.9 },
  dateMonthColumn: { flex: 1.25 },
  dateYearColumn: { flex: 1.1 },
  dateWheelContent: {
    paddingVertical: (dateWheelHeight - dateWheelRowHeight) / 2,
  },
  dateWheelItem: {
    height: dateWheelRowHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  dateWheelText: {
    color: "#C4C4C8",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "400",
  },
  dateWheelSelectedText: {
    color: "#30323A",
    fontSize: 18,
    fontWeight: "600",
  },
  dateWheelSelectedBand: {
    position: "absolute",
    top: (dateWheelHeight - dateWheelRowHeight) / 2,
    left: 8,
    right: 8,
    height: dateWheelRowHeight,
    borderRadius: 12,
    backgroundColor: "#F0F0F5",
  },
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
  inputRowError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FFF5F5",
  },
  input: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 14,
    color: "#493321",
    fontSize: 16,
  },
  emailSubmitButton: {
    minHeight: 66,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    borderRadius: 23,
  },
  emailSubmitButtonText: { fontSize: 18, fontWeight: "700" },
  facebookButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 23,
    backgroundColor: "#1687F8",
  },
  facebookButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  providerButtonText: {
    color: "#153D32",
    fontSize: 18,
    fontWeight: "700",
  },
  providerIcon: { fontSize: 26 },
  emailButton: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#B8B7A3",
    borderRadius: 23,
    backgroundColor: "#FFFEFA",
  },
  emailButtonText: {
    color: "#153D32",
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    marginTop: "2%",
    marginBottom: "2%",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  disabledButton: { opacity: 0.5 },
  providerStack: { width: "100%", gap: "5%" },
  googleProviderButton: {
    minHeight: 66,
    marginBottom: 0,
    borderColor: "#9BA99A",
    borderRadius: 23,
    backgroundColor: "#FFFEFA",
  },
  providerSetupHint: {
    marginVertical: 0,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  appleButton: {
    width: "100%",
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 23,
    backgroundColor: "#050505",
  },
  appleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
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
  link: { color: "#1687F8", fontSize: 16, fontWeight: "700" },
});
