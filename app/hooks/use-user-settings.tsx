import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ColorSchemePreference = "system" | "light" | "dark";
export type AccentStyle = "violet" | "ocean" | "ember" | "forest" | "slate";
export type DensityPreference = "comfortable" | "compact";
export type SiteStyle = "default" | "high-contrast";
export type ConsoleModeSetting = "output" | "terminal";

export interface UserSettings {
  editor: {
    theme: string;
    fontSize: number;
    tabSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
    keybinds: string;
    autoSaveDelay: number;
  };
  terminal: {
    fontSize: number;
    showTimestamps: boolean;
    clearOnRun: boolean;
    cursorStyle: string;
    scrollbackLimit: number;
  };
  general: {
    autoSave: boolean;
    confirmDelete: boolean;
    defaultExtension: string;
    notifications: {
      codeRunSuccess: boolean;
      codeRunError: boolean;
      newFeatures: boolean;
    };
  };
  appearance: {
    colorScheme: ColorSchemePreference;
    accent: AccentStyle;
    density: DensityPreference;
    siteStyle: SiteStyle;
  };
  playground: {
    defaultConsoleMode: ConsoleModeSetting;
    showSidebar: boolean;
    showConsole: boolean;
    showExamples: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  editor: {
    theme: "vs-dark",
    fontSize: 14,
    tabSize: 4,
    wordWrap: false,
    minimap: true,
    lineNumbers: true,
    keybinds: "default",
    autoSaveDelay: 2,
  },
  terminal: {
    fontSize: 13,
    showTimestamps: false,
    clearOnRun: true,
    cursorStyle: "block",
    scrollbackLimit: 1000,
  },
  general: {
    autoSave: true,
    confirmDelete: true,
    defaultExtension: ".smba",
    notifications: {
      codeRunSuccess: true,
      codeRunError: true,
      newFeatures: true,
    },
  },
  appearance: {
    colorScheme: "system",
    accent: "violet",
    density: "comfortable",
    siteStyle: "default",
  },
  playground: {
    defaultConsoleMode: "output",
    showSidebar: true,
    showConsole: true,
    showExamples: true,
  },
};

const STORAGE_KEY = "simba-user-settings";

function mergeSettings(parsed: Partial<UserSettings> | null | undefined): UserSettings {
  return {
    editor: { ...DEFAULT_SETTINGS.editor, ...parsed?.editor },
    terminal: { ...DEFAULT_SETTINGS.terminal, ...parsed?.terminal },
    general: {
      ...DEFAULT_SETTINGS.general,
      ...parsed?.general,
      notifications: {
        ...DEFAULT_SETTINGS.general.notifications,
        ...parsed?.general?.notifications,
      },
    },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed?.appearance },
    playground: { ...DEFAULT_SETTINGS.playground, ...parsed?.playground },
  };
}

export function readStoredSettings(): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    return mergeSettings(JSON.parse(stored) as Partial<UserSettings>);
  } catch (error) {
    console.error("Failed to load user settings:", error);
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: UserSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save user settings:", error);
  }
}

interface UserSettingsContextValue {
  settings: UserSettings;
  updateSettings: <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    value: UserSettings[T][K],
  ) => void;
  updateNotificationSetting: (key: keyof UserSettings["general"]["notifications"], value: boolean) => void;
  resetSettings: () => void;
  getSetting: <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    defaultValue?: UserSettings[T][K],
  ) => UserSettings[T][K];
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(readStoredSettings);

  const saveSettings = useCallback((newSettings: UserSettings) => {
    persistSettings(newSettings);
  }, []);

  const updateSettings = useCallback(
    <T extends keyof UserSettings, K extends keyof UserSettings[T]>(category: T, key: K, value: UserSettings[T][K]) => {
      setSettings((prev) => {
        const newSettings = {
          ...prev,
          [category]: {
            ...prev[category],
            [key]: value,
          },
        };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  const updateNotificationSetting = useCallback(
    (key: keyof UserSettings["general"]["notifications"], value: boolean) => {
      setSettings((prev) => {
        const newSettings = {
          ...prev,
          general: {
            ...prev.general,
            notifications: {
              ...prev.general.notifications,
              [key]: value,
            },
          },
        };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const getSetting = useCallback(
    <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
      category: T,
      key: K,
      defaultValue?: UserSettings[T][K],
    ): UserSettings[T][K] => {
      return settings[category]?.[key] ?? defaultValue ?? DEFAULT_SETTINGS[category][key];
    },
    [settings],
  );

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      updateNotificationSetting,
      resetSettings,
      getSetting,
    }),
    [settings, updateSettings, updateNotificationSetting, resetSettings, getSetting],
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}
