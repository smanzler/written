import { create } from "zustand";
import { MLCEngine, hasModelInCache, prebuiltAppConfig } from "@mlc-ai/web-llm";
import { toast } from "sonner";

type LLMStatus =
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
  status: LLMStatus;
  progress: number;
  timeElapsed: number;
  error?: string;
  currentModelId?: string;
  targetModelId?: string;
  isCached: boolean | null;
  changeModel: (id: string) => Promise<void>;
  resetStatus: () => void;
  getEngine: () => MLCEngine;
  cleanUpText: (
    text: string,
    prompt: string
  ) => Promise<{ title: string; body: string }>;
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
      const status: LLMStatus =
        progress >= 100
          ? "loading"
          : progress > 0
          ? "downloading"
          : state.status;

      return {
        ...state,
        status,
        progress,
        timeElapsed: report.timeElapsed,
      };
    });
  });

  return {
    models: LLM_MODELS,
    engine,
    status: "idle",
    progress: 0,
    timeElapsed: 0,
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
        timeElapsed: 0,
        error: undefined,
      });
      toast.loading(`Loading model ${model.label}...`);

      try {
        const cached = await hasModelInCache(model.modelId, prebuiltAppConfig);
        set({
          isCached: cached,
        });

        await engine.reload(model.modelId);

        set({
          currentModelId: id,
          targetModelId: undefined,
          status: "ready",
          progress: 100,
          error: undefined,
        });
        toast.dismiss();
        toast.success(`Model ${model.label} loaded successfully`);
      } catch (err) {
        const description =
          err instanceof Error
            ? err.message
            : "Unknown error while loading model";

        console.error(err);
        set({
          status: "error",
          error: description,
          targetModelId: undefined,
        });

        toast.dismiss();
        toast.error(`Failed to load model ${model.label}`);
        throw err;
      }
    },
    resetStatus() {
      set({
        status: "idle",
        progress: 0,
        timeElapsed: 0,
        error: undefined,
        targetModelId: undefined,
      });
    },
    getEngine() {
      return engine;
    },
    async cleanUpText(
      text: string,
      prompt: string
    ): Promise<{ title: string; body: string }> {
      const { currentModelId, status } = get();
      if (!currentModelId || status !== "ready") {
        throw new Error("Model not ready");
      }

      const model = LLM_MODELS.find((m) => m.id === currentModelId);
      if (!model) {
        throw new Error("Model not found");
      }

      try {
        const engine = get().getEngine();
        const response = await engine.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are an expert editor and writing assistant. ${prompt}. Always respond with a JSON object containing { title, body }`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 2000,
        });

        const json = JSON.parse(
          response.choices[0]?.message?.content?.trim() || "{}"
        );

        if (typeof json !== "object" || !json.title || !json.body) {
          throw new Error("Invalid response format");
        }

        return {
          title: json.title,
          body: json.body,
        };
      } catch (error) {
        throw error;
      }
    },
  };
});
