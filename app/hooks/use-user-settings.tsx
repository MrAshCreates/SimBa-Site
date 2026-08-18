import { useState, useEffect, useCallback } from "react";

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
}

const DEFAULT_SETTINGS: UserSettings = {
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
};

const STORAGE_KEY = "simba-user-settings";

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setSettings({
          editor: { ...DEFAULT_SETTINGS.editor, ...parsedSettings.editor },
          terminal: { ...DEFAULT_SETTINGS.terminal, ...parsedSettings.terminal },
          general: {
            ...DEFAULT_SETTINGS.general,
            ...parsedSettings.general,
            notifications: {
              ...DEFAULT_SETTINGS.general.notifications,
              ...parsedSettings.general?.notifications,
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      // Reset to defaults if corrupted
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: UserSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save user settings:", error);
    }
  }, []);

  // Update a specific setting
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

  // Update nested notification settings
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

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Get a specific setting value
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

  return {
    settings,
    updateSettings,
    updateNotificationSetting,
    resetSettings,
    getSetting,
  };
}
