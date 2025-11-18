import { db, Settings } from "@/lib/db";
import React, { createContext, useContext, useEffect, useState } from "react";

type SettingsState = {
  id: number;
  lockEnabled: boolean;
  cursorColor: string;
  textColor: string;
  cleanupEnabled: boolean;
  cleanupPrompt: string;
  selectedModel: string | undefined;
};

type SettingsContextType = {
  settings: SettingsState;
  saving: boolean;
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
};

const cssColorToHex = (cssColor: string): string => {
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(cssColor)) {
    return cssColor;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");

    if (!ctx) return cssColor;

    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);

    const imageData = ctx.getImageData(0, 0, 1, 1);
    const r = imageData.data[0];
    const g = imageData.data[1];
    const b = imageData.data[2];

    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (error) {
    console.error(error);
    return cssColor;
  }
};

const getDefaultSettings = (): SettingsState => {
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();

  return {
    id: 1,
    lockEnabled: false,
    cursorColor: "#3b82f6",
    textColor: cssColorToHex(primaryColor),
    cleanupEnabled: false,
    cleanupPrompt: "Make me sound like a pirate.",
    selectedModel: undefined,
  };
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SettingsState>();
  const [saving, setSaving] = useState(false);

  const getStoredSettings = async () => {
    const storedSettings = await db.settings.get(1);
    return storedSettings;
  };

  const removeUndefined = <T extends Record<string, unknown>>(
    obj: T
  ): Partial<T> => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([key, value]) => value !== undefined && key !== "id"
      )
    ) as Partial<T>;
  };

  const saveSettings = async (newSettings: Partial<Settings>) => {
    setSaving(true);
    const current = await getStoredSettings();
    const joinedSettings = removeUndefined({ ...current, ...newSettings });
    await db.settings.put({ id: 1, ...joinedSettings });
    setSettings({ ...getDefaultSettings(), ...joinedSettings });
    setSaving(false);
  };

  const initialize = async () => {
    const storedSettings = await getStoredSettings();
    setSettings({ ...getDefaultSettings(), ...storedSettings });
  };

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!settings) return null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saving,
        saveSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

const SettingsContext = createContext<SettingsContextType | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => useContext(SettingsContext)!;
