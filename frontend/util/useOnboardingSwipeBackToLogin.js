import { useRef } from "react";
import { CommonActions, usePreventRemove } from "@react-navigation/native";

export default function useOnboardingSwipeBackToLogin(navigation) {
  const allowCustomNavigation = useRef(false);

  usePreventRemove(true, ({ data }) => {
    if (allowCustomNavigation.current) {
      allowCustomNavigation.current = false;
      navigation.dispatch(data.action);
      return;
    }

    setTimeout(() => {
      allowCustomNavigation.current = true;
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
        );
      } finally {
        allowCustomNavigation.current = false;
      }
    }, 0);
  });

  return function runAllowedNavigation(action) {
    allowCustomNavigation.current = true;
    try {
      action();
    } finally {
      allowCustomNavigation.current = false;
    }
  };
}
