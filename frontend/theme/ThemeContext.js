import { createContext, useContext, useEffect, useState } from "react";
import {
  getUserProfileByFirebaseUid,
  getUserSettings,
  updateUserSettings,
} from "../util/http";
import { useAuth } from "../context/AuthContext";
import { darkTheme, lightTheme } from "./Theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(true);
  const [backendUserId, setBackendUserId] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadTheme() {
      try {
        if (!user?.uid) {
          if (isCurrent) {
            setBackendUserId(null);
            setIsDarkMode(false);
          }
          return;
        }

        const profile = await getUserProfileByFirebaseUid(user.uid);
        if (!profile?.id) {
          throw new Error("Your profile does not have a database user ID.");
        }

        const settings = await getUserSettings(profile.id);
        if (isCurrent) setIsDarkMode(Boolean(settings?.darkmode));
        if (isCurrent) setBackendUserId(profile.id);
      } catch (error) {
        console.warn("Unable to load user theme settings:", error);
      } finally {
        if (isCurrent) setIsThemeLoading(false);
      }
    }

    loadTheme();

    return () => {
      isCurrent = false;
    };
  }, [user?.uid]);

  async function setDarkMode(darkmode) {
    const previousValue = isDarkMode;
    setIsDarkMode(darkmode);

    try {
      if (!backendUserId) {
        throw new Error("Unable to update theme before the user profile loads.");
      }

      await updateUserSettings({ user_id: backendUserId, darkmode });
    } catch (error) {
      setIsDarkMode(previousValue);
      throw error;
    }
  }

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        isThemeLoading,
        backendUserId,
        setDarkMode,
        theme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
