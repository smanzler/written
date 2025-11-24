import { create } from "zustand";
import { ReactNode } from "react";

type ButtonOption<T = any> = {
  label: string;
  value: T;
  variant?: "default" | "outline" | "destructive";
};

export type ButtonsDialogOptions<T = any> = {
  title: string;
  description?: string | ReactNode;
  buttons: ButtonOption<T>[];
};

export type PasswordDialogOptions = {
  title: string;
  description: string;
};

export type DialogType =
  | {
      type: "buttons";
      props: ButtonsDialogOptions;
    }
  | {
      type: "password";
      props: PasswordDialogOptions;
    };

type DialogStoreState = {
  isOpen: boolean;
  content: DialogType | null;
  resolver: ((value: any) => void) | null;
  openDialog: <T = any>(type: DialogType) => Promise<T>;
  closeDialog: (value: any) => void;
  clearContent: () => void;
};

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  isOpen: false,
  content: null,
  resolver: null,

  openDialog: <T = any>(options: DialogType) =>
    new Promise<T>((resolve) => {
      set({
        isOpen: true,
        content: options,
        resolver: resolve,
      });
    }),

  closeDialog: <T = any>(value: T) => {
    const resolver = get().resolver;
    if (resolver) resolver(value);

    set({
      isOpen: false,
      resolver: null,
    });
  },

  clearContent: () => set({ content: null }),
}));
