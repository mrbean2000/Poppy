import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  InteractionManager,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StackActions, useIsFocused } from "@react-navigation/native";
import {
  CopilotProvider,
  CopilotStep,
  useCopilot,
  walkthroughable,
} from "react-native-copilot";
import { updateUserSettings } from "../util/http";

export const walkthroughSteps = [
  {
    name: "profile",
    screen: "Home",
    text: "Tap your picture to choose a different Poppy avatar.",
  },
  {
    name: "language",
    screen: "Home",
    text: "Open language settings to change your native or learning language.",
  },
  {
    name: "vocabulary",
    screen: "Home",
    text: "Find the words you have saved in My Vocabulary.",
  },
  {
    name: "flashcards",
    screen: "Home",
    text: "Review your vocabulary with flashcards.",
  },
  {
    name: "settings",
    screen: "Home",
    text: "Update your preferences and replay this walkthrough in Settings.",
  },
  {
    name: "podcast",
    screen: "Home",
    text: "Find podcasts to practise listening.",
  },
  {
    name: "stories",
    screen: "Home",
    text: "Open all stories to find the article import option.",
  },
  {
    name: "addStory",
    screen: "Stories",
    text: "Use the plus button to open the import options.",
  },
  {
    name: "importUrl",
    screen: "Import",
    text: "Choose Import via URL to add an article from a link.",
  },
];

const WalkthroughContext = createContext(null);
export const WalkthroughTouchable = walkthroughable(TouchableOpacity);

export function WalkthroughStep({ name, children }) {
  const index = walkthroughSteps.findIndex((step) => step.name === name);
  const step = walkthroughSteps[index];
  return (
    <CopilotStep name={name} order={index + 1} text={step.text}>
      {children}
    </CopilotStep>
  );
}

function Tooltip() {
  const { stop } = useCopilot();
  const { index, advance, finish, busy, error } = useHomeWalkthrough();
  const step = walkthroughSteps[index];
  if (!step) return null;

  return (
    <View accessibilityViewIsModal>
      <Text style={{ color: "#172033", fontSize: 16, lineHeight: 23 }}>
        {step.text}
      </Text>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{ color: "#B42318", marginTop: 8 }}
        >
          {error}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 18,
        }}
      >
        <TouchableOpacity
          disabled={busy}
          onPress={() => finish(stop)}
          accessibilityRole="button"
        >
          <Text style={{ color: "#705200", fontWeight: "700" }}>Skip</Text>
        </TouchableOpacity>
        {index > 0 ? (
          <TouchableOpacity
            disabled={busy}
            onPress={() => advance(index - 1, stop)}
            accessibilityRole="button"
          >
            <Text style={{ color: "#705200", fontWeight: "700" }}>
              Previous
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          disabled={busy}
          onPress={() =>
            index === walkthroughSteps.length - 1
              ? finish(stop)
              : advance(index + 1, stop)
          }
          accessibilityRole="button"
        >
          <Text style={{ color: "#705200", fontWeight: "700" }}>
            {busy
              ? "Saving..."
              : index === walkthroughSteps.length - 1
              ? "Finish"
              : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepNumber() {
  const { index } = useHomeWalkthrough();
  return (
    <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{index + 1}</Text>
  );
}

function WalkthroughRuntime({ children }) {
  const { stop, visible } = useCopilot();
  const { interrupt, active, busy, setForeground } = useHomeWalkthrough();
  useEffect(() => {
    if (!active && visible) {
      stop().catch((error) =>
        console.warn("Unable to close interrupted walkthrough:", error)
      );
    }
  }, [active, stop, visible]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active" && active && !busy) {
        if (visible) {
          stop()
            .then(() => interrupt(true))
            .catch((error) => {
              console.warn("Unable to stop walkthrough:", error);
              interrupt(true);
            });
        } else {
          interrupt(true);
        }
      }
    });
    return () => subscription.remove();
  }, [active, busy, interrupt, setForeground, stop, visible]);
  return children;
}

export function HomeWalkthroughProvider({ children, navigationRef }) {
  const [index, setIndex] = useState(-1);
  const [ownerId, setOwnerId] = useState(null);
  const [replay, setReplay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [interruptions, setInterruptions] = useState(0);
  const [foreground, setForeground] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive"
  );
  const activeRef = useRef(false);
  const actionRef = useRef(false);
  const sessionRef = useRef(0);

  const interrupt = useCallback((wasInterrupted = false) => {
    activeRef.current = false;
    sessionRef.current += 1;
    actionRef.current = false;
    setIndex(-1);
    setOwnerId(null);
    setBusy(false);
    setError(null);
    if (wasInterrupted) setInterruptions((value) => value + 1);
  }, []);

  const begin = useCallback((id, isReplay) => {
    if (!id || activeRef.current) return false;
    activeRef.current = true;
    setOwnerId(id);
    setReplay(isReplay);
    setError(null);
    setIndex(0);
    return true;
  }, []);

  const advance = async (nextIndex, stop) => {
    if (actionRef.current || !navigationRef.isReady()) return;
    actionRef.current = true;
    const session = sessionRef.current;
    try {
      await stop();
      if (session !== sessionRef.current) return;
      const currentScreen = walkthroughSteps[index].screen;
      const nextScreen = walkthroughSteps[nextIndex].screen;
      if (currentScreen !== nextScreen) {
        if (nextIndex < index) navigationRef.goBack();
        else navigationRef.navigate(nextScreen);
      }
      setIndex(nextIndex);
    } catch (navigationError) {
      Alert.alert(
        "Walkthrough interrupted",
        `Unable to continue: ${navigationError.message}`
      );
      interrupt();
    } finally {
      actionRef.current = false;
    }
  };

  const finish = async (stop) => {
    if (actionRef.current || !ownerId) return;
    actionRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (!replay) {
        await updateUserSettings({
          user_id: ownerId,
          homeWalkthroughCompleted: true,
        });
      }
      await stop();
      if (
        navigationRef.isReady() &&
        navigationRef.getCurrentRoute()?.name !== "Home"
      ) {
        navigationRef.dispatch(StackActions.popTo("Home"));
      }
      interrupt();
    } catch (saveError) {
      setError(
        `Unable to save walkthrough completion: ${saveError.message}. Please try again.`
      );
      setBusy(false);
      actionRef.current = false;
    }
  };

  return (
    <WalkthroughContext.Provider
      value={{
        index,
        active: index >= 0,
        begin,
        advance,
        finish,
        interrupt,
        busy,
        error,
        interruptions,
        foreground,
        setForeground,
      }}
    >
      <CopilotProvider
        overlay="svg"
        tooltipComponent={Tooltip}
        stepNumberComponent={StepNumber}
      >
        <WalkthroughRuntime>{children}</WalkthroughRuntime>
      </CopilotProvider>
    </WalkthroughContext.Provider>
  );
}

export function useHomeWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context)
    throw new Error(
      "useHomeWalkthrough must be used inside HomeWalkthroughProvider"
    );
  return context;
}

export function useWalkthroughScreen(screen, scrollRef) {
  const { index, interrupt } = useHomeWalkthrough();
  const { start } = useCopilot();
  const focused = useIsFocused();
  const positions = useRef({});
  const containers = useRef({});
  const started = useRef(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const step = walkthroughSteps[index];
  if (started.current !== null && started.current !== index)
    started.current = null;

  const track = useCallback(
    (name, container) => (event) => {
      positions.current[name] = { y: event.nativeEvent.layout.y, container };
      setLayoutVersion((value) => value + 1);
    },
    []
  );
  const trackContainer = useCallback(
    (name) => (event) => {
      containers.current[name] = event.nativeEvent.layout.y;
      setLayoutVersion((value) => value + 1);
    },
    []
  );

  useEffect(() => {
    if (
      !focused ||
      !step ||
      step.screen !== screen ||
      !positions.current[step.name] ||
      started.current === index
    )
      return undefined;
    const position = positions.current[step.name];
    if (position.container && containers.current[position.container] == null)
      return undefined;
    let cancelled = false;
    let frame;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      if (scrollRef?.current) {
        const offset =
          position.y +
          (position.container ? containers.current[position.container] : 0);
        scrollRef.current.scrollTo({
          y: Math.max(0, offset - 120),
          animated: false,
        });
      }
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (!cancelled) {
            started.current = index;
            start(step.name).catch((error) => {
              console.warn("Unable to start walkthrough step:", error);
              Alert.alert(
                "Walkthrough interrupted",
                "Unable to display this walkthrough step. Please try again later."
              );
              interrupt();
            });
          }
        });
      });
    });
    return () => {
      cancelled = true;
      task.cancel();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [
    focused,
    index,
    interrupt,
    layoutVersion,
    screen,
    scrollRef,
    start,
    step,
  ]);

  return { track, trackContainer };
}
