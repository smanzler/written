import { db, Settings } from "@/lib/db";
import React, { createContext, useContext, useEffect, useState } from "react";

type SettingsState = {
  id: number;
  lockEnabled: boolean;
  cursorColor: string;
  textColor: string;
};

type SettingsContextType = {
  settings?: SettingsState;
  saving: boolean;
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SettingsState>();
  const [saving, setSaving] = useState(false);

  const getDefaultSettings = (): SettingsState => ({
    id: 1,
    lockEnabled: false,
    cursorColor: "#3b82f6",
    textColor: getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim(),
  });

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
