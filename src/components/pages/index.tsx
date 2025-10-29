import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { toast } from "sonner";
import { db } from "@/lib/db";

function Index() {
  const [userInput, setUserInput] = useState<string>("");
  const [translateX, setTranslateX] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

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
      setUserInput("");
    } catch (error) {
      console.error("Failed to add journal entry:", error);
      toast.error("Failed to add journal entry");
    }
  }, [userInput]);

  const handleKeyPress = useCallback(
    async (event: KeyboardEvent) => {
      const { key, ctrlKey } = event;

      if (key === " " || key === "Spacebar") {
        event.preventDefault();
        setUserInput((prev) => (prev.endsWith(" ") ? prev : prev + " "));
      } else if (ctrlKey && key === "Backspace") {
        setUserInput((prev) => {
          const trimmed = prev.trimEnd();
          const updated = trimmed.split(" ").slice(0, -1).join(" ");
          return updated;
        });
      } else if (key.length === 1) {
        setUserInput((prev) => prev + key);
      } else if (key === "Backspace") {
        setUserInput((prev) => {
          return prev.slice(0, -1);
        });
      } else if (key === "Enter") {
        await done();
      }
    },
    [done]
  );

  const reset = () => {
    setUserInput("");
  };

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth;
      const translate = -width;
      setTranslateX(translate);
    }
  }, [userInput]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center h-full overflow-hidden">
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
          {userInput}
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-blue-500 w-1 h-16 ml-1 rounded-full"
          />
        </motion.div>
      </div>

      <div className="flex flex-row gap-2 mt-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: userInput.split(" ").length > 1 ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button variant="default" onClick={done}>
            Done
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: userInput.split(" ").length > 1 ? 1 : 0,
          }}
          transition={{ duration: 1 }}
        >
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default Index;
