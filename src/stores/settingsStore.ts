import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SettingsState = {
  lockEnabled: boolean;
  cursorColor: string;
  textColor: string;
  cleanupEnabled: boolean;
  cleanupPrompt: string;
  selectedModel: string | undefined;
  encryptedMaster: string | undefined;
  keySalt: string | undefined;
  updated_at: Date;
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
    lockEnabled: false,
    cursorColor: "#3b82f6",
    textColor: cssColorToHex(primaryColor),
    cleanupEnabled: false,
    cleanupPrompt: "Make me sound like a pirate.",
    selectedModel: undefined,
    encryptedMaster: undefined,
    keySalt: undefined,
    updated_at: new Date(),
  };
};

type SettingsStoreState = {
  settings: SettingsState;
  initialized: boolean;
  saveSettings: (
    newSettings: Partial<Omit<SettingsState, "updated_at">>
  ) => void;
  initialize: () => void;
  resetSettings: () => void;
};

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => {
      const removeUndefined = <T extends Record<string, unknown>>(
        obj: T
      ): Partial<T> => {
        return Object.fromEntries(
          Object.entries(obj).filter(([_, value]) => value !== undefined)
        ) as Partial<T>;
      };

      return {
        settings: getDefaultSettings(),
        saving: false,
        initialized: false,
        initialize() {
          if (get().initialized) return;

          set({ initialized: true });
        },
        saveSettings(newSettings: Partial<Omit<SettingsState, "updated_at">>) {
          const current = get().settings;
          const joinedSettings = removeUndefined({
            ...current,
            ...newSettings,
          });
          set({
            settings: {
              ...getDefaultSettings(),
              ...joinedSettings,
              updated_at: new Date(),
            },
          });
        },
        resetSettings() {
          set({ settings: getDefaultSettings() });
        },
      };
    },
    {
      name: "written-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: {
          ...state.settings,
          updated_at: state.settings.updated_at.toISOString(),
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          settings?: Partial<SettingsState> & { updated_at?: string | Date };
        };

        if (!persisted.settings) {
          return currentState;
        }

        return {
          ...currentState,
          settings: {
            ...currentState.settings,
            ...persisted.settings,
            updated_at: persisted.settings.updated_at
              ? new Date(persisted.settings.updated_at as string)
              : currentState.settings.updated_at,
          },
        };
      },
    }
  )
);
