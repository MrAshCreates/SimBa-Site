import { useEffect, useRef } from "react";
import { useColorScheme } from "@dazl/color-scheme/react";
import { useUserSettings } from "~/hooks/use-user-settings";

const STORAGE_KEY = "simba-user-settings";

function storedAppearanceExists() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const parsed = JSON.parse(stored) as { appearance?: { colorScheme?: string } };
    return Boolean(parsed.appearance?.colorScheme);
  } catch {
    return false;
  }
}

export function AppearanceSync() {
  const { settings, updateSettings } = useUserSettings();
  const { configScheme, setColorScheme } = useColorScheme();
  const migrated = useRef(false);

  useEffect(() => {
    if (!migrated.current) {
      migrated.current = true;
      if (!storedAppearanceExists()) {
        updateSettings("appearance", "colorScheme", configScheme);
        return;
      }
    }

    if (settings.appearance.colorScheme !== configScheme) {
      setColorScheme(settings.appearance.colorScheme);
    }
  }, [configScheme, setColorScheme, settings.appearance.colorScheme, updateSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = settings.appearance.accent;
    root.dataset.density = settings.appearance.density;
    root.dataset.style = settings.appearance.siteStyle;
  }, [settings.appearance.accent, settings.appearance.density, settings.appearance.siteStyle]);

  return null;
}
