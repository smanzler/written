import { useState, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { db, Journal } from "@/lib/db";
import { useSidebar } from "../ui/sidebar";
import { CheckIcon, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { useJournalStore } from "@/stores/journalStore";
import LockedDialog from "../ui/locked-dialog";
import { useLLMStore } from "@/stores/llmStore";
import TextCarousel from "../ui/text-carousel";

function Index() {
  const [userInput, setUserInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef<string>("");
  const { open, setOpen } = useSidebar();
  const [isFocused, setIsFocused] = useState(false);
  const { settings } = useSettingsStore();
  const { encryptText, isUnlocked } = useJournalStore();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const { cleanUpText } = useLLMStore();

  const typing = userInput.length > prevInputRef.current.length;

  const reset = () => {
    prevInputRef.current = userInput;
    setUserInput("");
  };

  const done = async (key?: CryptoKey) => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;
    let content = trimmedInput;

    try {
      let cleanedContent: string | null = null;
      let journal: Omit<Journal, "id"> | null = null;

      if (!isUnlocked && settings.lockEnabled && !key) {
        inputRef.current?.blur();
        setOpenLockedDialog(true);
        return;
      }

      reset();

      toast.loading("Saving journal entry.");

      if (settings.cleanupEnabled && settings.cleanupPrompt) {
        const { body } = await cleanUpText(content, settings.cleanupPrompt);
        cleanedContent = body;
      }

      let blob = {
        content: content,
        cleaned_content: cleanedContent,
      };

      if (settings.lockEnabled) {
        const result = await encryptText(JSON.stringify(blob), key);

        journal = {
          raw_blob: null,
          encrypted_blob: JSON.stringify(result),
          is_encrypted: true,
          user_id: null,
          server_id: null,
          synced_at: null,
          sync_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      } else {
        journal = {
          raw_blob: JSON.stringify(blob),
          encrypted_blob: null,
          is_encrypted: false,
          user_id: null,
          server_id: null,
          synced_at: null,
          sync_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      }

      if (!journal) {
        toast.dismiss();
        toast.error("Failed to create journal entry");
        setUserInput(content);
        return;
      }

      await db.journals.add(journal);

      toast.dismiss();
      toast.success("Journal entry added successfully");
    } catch (error) {
      console.error("Failed to add journal entry:", error);
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add journal entry");
      }
      setUserInput(content);
    }
  };

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const tokens = useMemo(
    () => userInput.split(/(\s+)/).filter((t) => t.length > 0),
    [userInput]
  );

  const hasMultipleWords = useMemo(() => tokens.length > 1, [tokens]);

  return (
    <div
      className="flex flex-col items-center justify-center h-full overflow-hidden"
      onClick={focusInput}
      onTouchStart={focusInput}
    >
      <input
        name="user-input"
        ref={inputRef}
        value={userInput}
        onChange={(e) => {
          if (open) {
            setOpen(false);
          }
          const newValue = e.target.value;
          prevInputRef.current = userInput;
          setUserInput(newValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            done();
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 m-auto w-px h-px opacity-0"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        autoFocus
        spellCheck={false}
        inputMode="text"
      />
      <TextCarousel
        tokens={tokens}
        typing={typing}
        isFocused={isFocused}
        userInput={userInput}
        textColor={settings.textColor || "#000000"}
        cursorColor={settings.cursorColor || "#000000"}
        focusInput={focusInput}
      />

      <div className="flex flex-row mt-4">
        <motion.div
          animate={{
            opacity: hasMultipleWords ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button size="icon" variant="ghost" onClick={reset}>
            <RefreshCcw />
          </Button>
        </motion.div>
        <motion.div
          animate={{
            opacity: hasMultipleWords ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button size="icon" variant="ghost" onClick={() => done()}>
            <CheckIcon />
          </Button>
        </motion.div>
      </div>

      <LockedDialog
        open={openLockedDialog}
        onOpenChange={setOpenLockedDialog}
        onUnlock={async (key) => {
          if (key) {
            await done(key);
            inputRef.current?.focus();
          }
        }}
      />
    </div>
  );
}

export default Index;
