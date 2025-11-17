import { create } from "zustand";
import { MLCEngine, hasModelInCache, prebuiltAppConfig } from "@mlc-ai/web-llm";

type DownloadPhase =
  | "idle"
  | "checking-cache"
  | "downloading"
  | "loading"
  | "ready"
  | "error";

export type LocalLLMModel = {
  id: string;
  modelId: string;
  label: string;
  description: string;
  vram: string;
};

export type TaggedSection = {
  text: string;
  tag: string;
};

export const LLM_MODELS: LocalLLMModel[] = [
  {
    id: "llama-3.2-1b-q4f16",
    modelId: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B (q4f16)",
    description: "Fastest option, great for lightweight tagging.",
    vram: "~0.9 GB VRAM",
  },
  {
    id: "phi-3-mini-4k-q4f16",
    modelId: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    label: "Phi-3 Mini 4K (q4f16)",
    description: "Balanced quality and speed, 4k context.",
    vram: "~2.0 GB VRAM",
  },
  {
    id: "llama-3.1-8b-q4f16",
    modelId: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    label: "Llama 3.1 8B (q4f16)",
    description: "Highest quality, best for cleanup.",
    vram: "~6.5 GB VRAM",
  },
];

const engine = new MLCEngine({
  appConfig: prebuiltAppConfig,
});

type LLMStoreState = {
  models: typeof LLM_MODELS;
  engine: MLCEngine;
  status: DownloadPhase;
  progress: number;
  message?: string;
  error?: string;
  currentModelId?: string;
  targetModelId?: string;
  isCached: boolean | null;
  changeModel: (id: string) => Promise<void>;
  resetStatus: () => void;
  getEngine: () => MLCEngine;
  cleanUpText: (text: string) => Promise<string>;
  tagText: (text: string) => Promise<TaggedSection[]>;
};

export const useLLMStore = create<LLMStoreState>((set, get) => {
  engine.setInitProgressCallback((report) => {
    set((state) => {
      if (!state.targetModelId) {
        return state;
      }

      const progress = Math.min(
        100,
        Math.max(0, Math.round(report.progress * 100))
      );
      const status: DownloadPhase =
        progress >= 100
          ? "loading"
          : progress > 0
          ? "downloading"
          : state.status;

      return {
        ...state,
        status,
        progress,
        message: report.text,
      };
    });
  });

  return {
    models: LLM_MODELS,
    engine,
    status: "idle",
    progress: 0,
    message: undefined,
    error: undefined,
    currentModelId: undefined,
    targetModelId: undefined,
    isCached: null,
    async changeModel(id) {
      if (!id) return;

      const { status, currentModelId } = get();
      if (currentModelId === id && status === "ready") {
        return;
      }

      if (
        ["checking-cache", "downloading", "loading"].includes(status) &&
        get().targetModelId === id
      ) {
        return;
      }

      const model = LLM_MODELS.find((option) => option.id === id);
      if (!model) {
        throw new Error(`Unknown model id: ${id}`);
      }

      set({
        targetModelId: id,
        status: "checking-cache",
        progress: 0,
        message: "Checking browser cache…",
        error: undefined,
      });

      try {
        const cached = await hasModelInCache(model.modelId, prebuiltAppConfig);
        set({
          isCached: cached,
          message: cached
            ? "Model found in cache. Loading…"
            : "Model not cached. Downloading…",
        });

        await engine.reload(model.modelId);

        set({
          currentModelId: id,
          targetModelId: undefined,
          status: "ready",
          progress: 100,
          message: cached
            ? `${model.label} loaded from cache.`
            : `${model.label} downloaded and ready.`,
          error: undefined,
        });
      } catch (err) {
        const description =
          err instanceof Error
            ? err.message
            : "Unknown error while loading model";

        console.error(err);
        set({
          status: "error",
          error: description,
          message: "Unable to load model.",
          targetModelId: undefined,
        });

        throw err;
      }
    },
    resetStatus() {
      set({
        status: "idle",
        progress: 0,
        message: undefined,
        error: undefined,
        targetModelId: undefined,
      });
    },
    getEngine() {
      return engine;
    },
    async cleanUpText(text: string): Promise<string> {
      const { currentModelId, status } = get();
      if (!currentModelId || status !== "ready") {
        return text;
      }

      const model = LLM_MODELS.find((m) => m.id === currentModelId);
      if (!model) {
        return text;
      }

      try {
        const engine = get().getEngine();
        const response = await engine.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that cleans up and improves text. Fix grammar, spelling, punctuation, and improve clarity while preserving the original meaning and tone. Return only the cleaned text without any explanations or additional commentary.",
            },
            {
              role: "user",
              content: `Please clean up and improve the following text:\n\n${text}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });

        console.log("response from cleaning up: ", response);

        const cleanedText =
          response.choices[0]?.message?.content?.trim() || text;
        return cleanedText;
      } catch (error) {
        console.error("Error cleaning up text:", error);
        return text;
      }
    },
    async tagText(text: string): Promise<TaggedSection[]> {
      const { currentModelId, status } = get();
      if (!currentModelId || status !== "ready") {
        return [];
      }

      const model = LLM_MODELS.find((m) => m.id === currentModelId);
      if (!model) {
        return [];
      }

      const engine = get().getEngine();
      const taggedSections: TaggedSection[] = [];

      try {
        const response = await engine.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that analyzes text sections and suggests a single relevant tag. Analyze the content and suggest ONE tag that best describes the main topic, emotion, or theme of this section. Return only the tag, nothing else. Keep the tag short (1-3 words).",
            },
            {
              role: "user",
              content: `Analyze this text section and suggest a single relevant tag:\n\n${text}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 20,
        });

        console.log("response from tagging: ", response);

        const tag = response.choices[0]?.message?.content?.trim() || "untagged";
        taggedSections.push({ text, tag });
      } catch (error) {
        console.error("Error tagging section:", error);
        taggedSections.push({ text, tag: "untagged" });
      }

      return taggedSections;
    },
  };
});
