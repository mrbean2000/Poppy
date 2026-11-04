import { createContext, useContext, useMemo, useState } from "react";
import {
  initialOnboardingSelections,
  updateOnboardingSelection,
} from "../util/onboardingSelections";

const OnboardingSelectionContext = createContext(null);

export function OnboardingSelectionProvider({ children }) {
  const [selections, setSelections] = useState(initialOnboardingSelections);

  const value = useMemo(
    () => ({
      selections,
      setSelection: (key, value) => {
        setSelections((currentSelections) =>
          updateOnboardingSelection(currentSelections, key, value),
        );
      },
    }),
    [selections],
  );

  return (
    <OnboardingSelectionContext.Provider value={value}>
      {children}
    </OnboardingSelectionContext.Provider>
  );
}

export function useOnboardingSelections() {
  const context = useContext(OnboardingSelectionContext);

  if (!context) {
    throw new Error(
      "useOnboardingSelections must be used within OnboardingSelectionProvider",
    );
  }

  return context;
}
