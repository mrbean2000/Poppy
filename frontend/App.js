import { useEffect, useRef, useState } from "react";
import HomeScreen from "./screen/HomeScreen";
import LanguageSelectionScreen from "./screen/LanguageSelectionScreen";
import ReaderScreen from "./screen/ReaderScreen";
import SettingsScreen from "./screen/SettingScreen";
import ProfilePictureScreen from "./screen/ProfilePictureScreen";
import DeleteAccountScreen from "./screen/DeleteAccountScreen";
import StoriesScreen from "./screen/StoriesScreen";
import MyVocabularyScreen from "./screen/MyVocabularyScreen";
import VocabularyDetailScreen from "./screen/VocabularyDetailScreen";
import FlashcardsScreen from "./screen/FlashcardsScreen";
import ImportScreen from "./screen/ImportScreen";
import ImportUrlScreen from "./screen/ImportUrlScreen";
import ImportYourselfScreen from "./screen/ImportYourselfScreen";
import ImportCameraScreen from "./screen/ImportCameraScreen";
import PodcastScreen from "./screen/PodcastScreen";
import PodcastEpisodesScreen from "./screen/PodcastEpisodesScreen";
import PodcastPlayerScreen from "./screen/PodcastPlayerScreen";
import RecentHistoryScreen from "./screen/RecentHistoryScreen";
import PodcastMiniPlayer from "./components/PodcastMiniPlayer";
import { PodcastPlaybackProvider } from "./components/PodcastPlaybackContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OnboardingSelectionProvider } from "./context/OnboardingSelectionContext";
import { HomeWalkthroughProvider } from "./context/HomeWalkthroughContext";
import { HomePanelContext } from "./context/HomePanelContext";
import LoginScreen from "./screen/LoginScreen";
import CreateAccountScreen from "./screen/CreateAccountScreen";
import OnboardingDailyReadingGoalScreen from "./screen/OnboardingDailyReadingGoalScreen";
import OnboardingDailyListeningGoalScreen from "./screen/OnboardingDailyListeningGoalScreen";
import OnboardingNativeLanguageScreen from "./screen/OnboardingNativeLanguageScreen";
import OnboardingLearningLanguageScreen from "./screen/OnboardingLearningLanguageScreen";
import OnboardingWeeklyGoalSummaryScreen from "./screen/OnboardingWeeklyGoalSummaryScreen";
import OnboardingThreeMonthBenefitsScreen from "./screen/OnboardingThreeMonthBenefitsScreen";
import OnboardingReminderScreen from "./screen/OnboardingReminderScreen";
import TrialOfferScreen from "./screen/TrialOfferScreen";
import TrialStartedScreen from "./screen/TrialStartedScreen";
import { ThemeProvider } from "./theme/ThemeContext";
import { createNavigationContainerRef, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
// import { Platform } from "react-native";
// import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatGate from "./components/RevenueCatGate";

const Stack = createNativeStackNavigator();
const miniPlayerRoutes = new Set([
  "Home",
  "Podcast",
  "PodcastEpisodes",
  "PodcastPlayer",
  "RecentPodcasts",
  "RecentArticles",
  "Reader",
  "Stories",
  "Settings",
  "ProfilePicture",
  "DeleteAccount",
  "LanguageSelection",
  "Vocabulary",
  "VocabularyDetail",
  "Flashcards",
  "Import",
  "ImportUrl",
  "ImportYourself",
  "ImportCamera",
]);
// RevenueCat is temporarily disabled, including when its environment flag is set.
const useRevenueCatPaywall = false;
// const useRevenueCatPaywall =
//   Platform.OS === "ios" &&
//   process.env.EXPO_PUBLIC_REVENUECAT_IOS_ENABLED === "true";

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn("Unable to keep the native splash screen visible:", error);
});

function AppNavigation() {
  const { user, isLoading, checkSubscriptionStatus } = useAuth();
  const navigationRef = useRef(createNavigationContainerRef()).current;
  const [areBackgroundImagesReady, setAreBackgroundImagesReady] =
    useState(false);
  const [subscriptionRoute, setSubscriptionRoute] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [homePanelOpen, setHomePanelOpen] = useState(false);
  const initialRouteName = user
    ? subscriptionRoute?.uid === user.uid
      ? subscriptionRoute.route
      : null
    : "Login";

  useEffect(() => {

    // if (!useRevenueCatPaywall) {
    //   Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    //   const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
    //   Purchases.configure({ apiKey });
    // }

    let isCurrent = true;

    Asset.loadAsync([
      require("./assets/images/masot/poppy_loadingscreen.png"),
      require("./assets/images/masot/backgroundimagequestion.png"),
      require("./assets/images/masot/poppy_raincoatquestion.png"),
      require("./assets/images/masot/poppy_music.png"),
      require("./assets/images/masot/poppy_trophy.png"),
      require("./assets/images/masot/poppy_notification.png"),
      require("./assets/images/masot/poppy_passingexam.png"),
      require("./assets/images/masot/paywall_background.png"),
      require("./assets/images/masot/backgroundimagequestion_darkmode.png"),
    ])
      .then(() => {
        if (isCurrent) setAreBackgroundImagesReady(true);
      })
      .catch((error) => {
        console.warn("Unable to preload the app background images:", error);
        if (isCurrent) setAreBackgroundImagesReady(true);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  // Check subscription status when user logs in
  useEffect(() => {
    if (!user) {
      setSubscriptionRoute(null);
      return undefined;
    }

    if (useRevenueCatPaywall) {
      setSubscriptionRoute({ uid: user.uid, route: "Home" });
      return undefined;
    }

    let isCurrent = true;
    const uid = user.uid;

    const checkSubscription = async () => {
      let route = "TrialOffer";
      try {
        const { hasActiveSubscription } = await checkSubscriptionStatus();
        if (hasActiveSubscription) route = "Home";
      } catch (error) {
        console.warn("Error checking subscription:", error);
      }
      if (isCurrent) setSubscriptionRoute({ uid, route });
    };

    checkSubscription();
    return () => {
      isCurrent = false;
    };
  }, [user, checkSubscriptionStatus]);

  // Wait for the subscription check so the navigator mounts with a valid initial route
  if (isLoading || !areBackgroundImagesReady || !initialRouteName) return null;

  const navigation = (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setActiveRoute(navigationRef.getCurrentRoute()?.name);
        SplashScreen.hideAsync().catch((error) => {
          console.warn("Unable to hide the native splash screen:", error);
        });
      }}
      onStateChange={() => {
        setActiveRoute(navigationRef.getCurrentRoute()?.name);
      }}
    >
      <Stack.Navigator
        key={user ? "authenticated" : "unauthenticated"}
        initialRouteName={initialRouteName}
        detachInactiveScreens={false}
      >
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TrialOffer"
              component={useRevenueCatPaywall ? HomeScreen : TrialOfferScreen}
              options={{
                headerShown: false,
                gestureEnabled: false,
                contentStyle: { backgroundColor: "transparent" },
              }}
            />
            <Stack.Screen
              name="TrialStarted"
              component={TrialStartedScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Podcast"
              component={PodcastScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PodcastEpisodes"
              component={PodcastEpisodesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RecentPodcasts"
              component={RecentHistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RecentArticles"
              component={RecentHistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PodcastPlayer"
              component={PodcastPlayerScreen}
              options={{
                headerShown: false,
                presentation: "modal",
                animation: "slide_from_bottom",
                animationMatchesGesture: true,
                gestureEnabled: true,
                gestureDirection: "vertical",
              }}
            />
            <Stack.Screen
              name="Reader"
              component={ReaderScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Stories"
              component={StoriesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfilePicture"
              component={ProfilePictureScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DeleteAccount"
              component={DeleteAccountScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="LanguageSelection"
              component={LanguageSelectionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Vocabulary"
              component={MyVocabularyScreen}
              options={{ headerShown: false, gestureEnabled: true }}
            />
            <Stack.Screen
              name="VocabularyDetail"
              component={VocabularyDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Flashcards"
              component={FlashcardsScreen}
              options={{
                headerShown: false,
                animation: "slide_from_bottom",
                animationDuration: 300,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="Import"
              component={ImportScreen}
              options={{ headerShown: false, animation: "none" }}
            />
            <Stack.Screen
              name="ImportUrl"
              component={ImportUrlScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="ImportYourself"
              component={ImportYourselfScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="ImportCamera"
              component={ImportCameraScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="CreateAccount"
              component={CreateAccountScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="OnboardingNativeLanguageScreen"
              component={OnboardingNativeLanguageScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="OnboardingDailyReadingGoalScreen"
              component={OnboardingDailyReadingGoalScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
                freezeOnBlur: false,
                contentStyle: { backgroundColor: "#F7F1E8" },
              }}
            />
            <Stack.Screen
              name="OnboardingDailyListeningGoalScreen"
              component={OnboardingDailyListeningGoalScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
                detachPreviousScreen: false,
                freezeOnBlur: false,
                contentStyle: { backgroundColor: "#F7F1E8" },
              }}
            />
            <Stack.Screen
              name="OnboardingWeeklyGoalSummaryScreen"
              component={OnboardingWeeklyGoalSummaryScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
                freezeOnBlur: false,
                contentStyle: { backgroundColor: "#F7F1E8" },
              }}
            />
            <Stack.Screen
              name="OnboardingThreeMonthBenefitsScreen"
              component={OnboardingThreeMonthBenefitsScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="OnboardingReminderScreen"
              component={OnboardingReminderScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="OnboardingLearningLanguageScreen"
              component={OnboardingLearningLanguageScreen}
              options={{
                headerShown: false,
                animation: "none",
                gestureEnabled: false,
                contentStyle: { backgroundColor: "#F7F1E8" },
              }}
            />
            <Stack.Screen
              name="TrialOffer"
              component={useRevenueCatPaywall ? LoginScreen : TrialOfferScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
      {user && miniPlayerRoutes.has(activeRoute) && !(activeRoute === "Home" && homePanelOpen)
        ? <PodcastMiniPlayer />
        : null}
    </NavigationContainer>
  );

  return (
    <HomePanelContext.Provider value={setHomePanelOpen}>
      <HomeWalkthroughProvider key={user?.uid ?? "anonymous"} navigationRef={navigationRef}>
        {useRevenueCatPaywall && user ? (
          <RevenueCatGate key={user.uid} user={user}>
            {navigation}
          </RevenueCatGate>
        ) : (
          navigation
        )}
      </HomeWalkthroughProvider>
    </HomePanelContext.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <OnboardingSelectionProvider>
            <PodcastPlaybackProvider>
              <AppNavigation />
            </PodcastPlaybackProvider>
          </OnboardingSelectionProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
