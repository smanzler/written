import { useState, useRef, useMemo, useLayoutEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { db, Journal } from "@/lib/db";
import { useSidebar } from "../ui/sidebar";
import { CheckIcon, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { useSettings } from "@/providers/SettingsProvider";
import { useJournal } from "@/providers/JournalProvider";
import LockedDialog from "../ui/locked-dialog";
import { useLLMStore } from "@/stores/llmStore";

function getRainbowColor(index: number): string {
  const hue = (index * 10) % 360;
  return `hsl(${hue}, 100%, 50%)`;
}

function Index() {
  const [userInput, setUserInput] = useState<string>("");
  const [translateX, setTranslateX] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef<string>("");
  const { open, setOpen } = useSidebar();
  const [isFocused, setIsFocused] = useState(false);
  const { settings } = useSettings();
  const { encryptText, isUnlocked } = useJournal();
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

      if (!isUnlocked && settings?.lockEnabled && !key) {
        inputRef.current?.blur();
        setOpenLockedDialog(true);
        return;
      }

      reset();

      toast.loading("Saving journal entry.");

      if (settings?.cleanupEnabled && settings.cleanupPrompt) {
        const { body } = await cleanUpText(content, settings.cleanupPrompt);
        cleanedContent = body;
      }

      let blob = {
        content: content,
        cleaned_content: cleanedContent,
      };

      if (settings?.lockEnabled) {
        const result = await encryptText(JSON.stringify(blob), key);

        journal = {
          raw_blob: null,
          encrypted_blob: JSON.stringify(result),
          is_encrypted: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
      } else {
        journal = {
          raw_blob: JSON.stringify(blob),
          encrypted_blob: null,
          is_encrypted: false,
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

  useLayoutEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth;
      const translate = -width;
      setTranslateX(translate);
    }
  }, [userInput]);

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
      <div
        className="relative w-0 whitespace-nowrap text-center"
        onTouchStart={focusInput}
        onClick={focusInput}
      >
        <motion.div
          ref={textRef}
          className="text-[4rem] inline-flex items-center h-24 whitespace-pre"
          style={{ color: settings?.textColor }}
          animate={{ x: translateX }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          {(() => {
            let cumulativeIndex = 0;

            return tokens.map((token, index) => {
              const startIndex = cumulativeIndex;
              cumulativeIndex += token.length;

              return (
                <motion.span
                  key={index}
                  animate={{
                    opacity: index >= tokens.length - (typing ? 1 : 2) ? 1 : 0,
                    visibility:
                      index < tokens.length - (typing ? 1 : 2)
                        ? "hidden"
                        : "visible",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                >
                  {settings?.textColor === "rainbow"
                    ? token.split("").map((char, charIndex) => (
                        <span
                          key={charIndex}
                          style={{
                            color: getRainbowColor(startIndex + charIndex),
                          }}
                        >
                          {char}
                        </span>
                      ))
                    : token}
                </motion.span>
              );
            });
          })()}
          <motion.span
            animate={{
              opacity: isFocused ? [1, 0.4, 1] : 0,
            }}
            transition={
              isFocused
                ? {
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }
                : {
                    duration: 0.1,
                    ease: "easeInOut",
                  }
            }
            className="w-1 h-16 ml-1 rounded-full"
            style={{ backgroundColor: settings?.cursorColor }}
          />
        </motion.div>
      </div>

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
