import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { useSidebar } from "../ui/sidebar";
import { CheckIcon, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";

function Index() {
  const [userInput, setUserInput] = useState<string>("");
  const [translateX, setTranslateX] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevInputRef = useRef<string>("");
  const { open, setOpen } = useSidebar();

  const typing = userInput.length > prevInputRef.current.length;

  const reset = useCallback(() => {
    prevInputRef.current = userInput;
    setUserInput("");
  }, [userInput]);

  const done = useCallback(async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    try {
      await db.journals.add({
        title: "",
        content: trimmedInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success("Journal entry added successfully");
      reset();
    } catch (error) {
      console.error("Failed to add journal entry:", error);
      toast.error("Failed to add journal entry");
    }
  }, [userInput, reset]);

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth;
      const translate = -width;
      setTranslateX(translate);
    }
  }, [userInput]);

  const focusInput = () => {
    if (inputRef.current) inputRef.current.focus();
  };
  const tokens = userInput.split(/(\s+)/).filter((t) => t.length > 0);

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
        className="fixed bottom-0 left-0 w-px h-px opacity-0"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
      />
      <div className="relative w-0 whitespace-nowrap text-center">
        <motion.div
          ref={textRef}
          className="text-[4rem] inline-flex items-center h-24 whitespace-pre"
          animate={{ x: translateX }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          {tokens.map((token, index) => (
            <motion.span
              key={index}
              animate={{
                opacity: index >= tokens.length - (typing ? 1 : 2) ? 1 : 0,
              }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              {token}
            </motion.span>
          ))}
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-blue-500 w-1 h-16 ml-1 rounded-full"
          />
        </motion.div>
      </div>

      <div className="flex flex-row mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: userInput.split(" ").length > 1 ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button size="icon" variant="ghost" onClick={reset}>
            <RefreshCcw />
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: userInput.split(" ").length > 1 ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button size="icon" variant="ghost" onClick={done}>
            <CheckIcon />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default Index;
