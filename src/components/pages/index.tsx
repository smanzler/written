import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

function Index() {
  const [userInput, setUserInput] = useState<string>("");
  const [translateX, setTranslateX] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const containerWidth = 0;

  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    const { key, ctrlKey } = event;

    if (key === " " || key === "Spacebar") {
      event.preventDefault();
      setUserInput((prev) => (prev.endsWith(" ") ? prev : prev + " "));
    } else if (ctrlKey && key === "Backspace") {
      setUserInput((prev) => {
        const trimmed = prev.trimEnd();
        const updated = trimmed.split(" ").slice(0, -1).join(" ");
        return updated.length > 0 ? updated + " " : updated;
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
  }, []);

  const done = async () => {
    setUserInput((currentInput) => {
      const trimmedInput = currentInput.trim();
      if (!trimmedInput) {
        return currentInput;
      }

      try {
        // TODO: Add journal entry to database
        return "";
      } catch (error) {
        console.error("Failed to add journal entry:", error);
        alert("An error occurred while adding the entry.");
        return currentInput;
      }
    });
  };

  const reset = () => {
    setUserInput("");
  };

  useEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth;
      const translate = !userInput ? 0 : Math.min(0, containerWidth - width);
      setTranslateX(translate);
    }
  }, [userInput]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-0 whitespace-nowrap text-center">
        <motion.div
          ref={textRef}
          className="text-[4rem] inline-flex items-center h-24 whitespace-pre"
          initial={{ x: 0 }}
          animate={{ x: translateX }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
          }}
        >
          {userInput}
          <span className="bg-blue-500 animate-pulse w-1 h-16 ml-1 rounded-full" />
        </motion.div>
      </div>

      <div className="flex flex-row gap-2 mt-4">
        <Button variant="default" onClick={done}>
          Done
        </Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export default Index;
