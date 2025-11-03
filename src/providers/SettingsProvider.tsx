import { db, Settings } from "@/lib/db";
import React, { createContext, useContext, useEffect, useState } from "react";

type SettingsState = {
  id: number;
  lockEnabled: boolean;
  cursorColor: string;
};

type SettingsContextType = {
  settings?: SettingsState;
  saving: boolean;
  saveSettings: (newSettings: Partial<Settings>) => Promise<void>;
};

const DEFAULT_SETTINGS: SettingsState = {
  id: 1,
  lockEnabled: false,
  cursorColor: "blue",
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

  const saveSettings = async (newSettings: Partial<Settings>) => {
    setSaving(true);
    const current = await getStoredSettings();
    const joinedSettings = { ...current, ...newSettings };
    await db.settings.put({ id: 1, ...joinedSettings });
    setSettings({ ...DEFAULT_SETTINGS, ...joinedSettings });
    setSaving(false);
  };

  const initialize = async () => {
    const storedSettings = await getStoredSettings();
    setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
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
