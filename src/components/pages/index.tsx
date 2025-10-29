import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

function Index() {
  const [userInput, setUserInput] = useState("");
  const textRef = useRef<HTMLDivElement>(null);

  const addKey = (key: string) => {
    setUserInput((prev) => prev + key);
  };

  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    const { key, ctrlKey } = event;

    if (key === " " || key === "Spacebar") {
      event.preventDefault();
      addKey(" ");
    } else if (ctrlKey && key === "Backspace") {
      setUserInput((prev) => {
        const trimmed = prev.trimEnd();
        const updated = trimmed.split(" ").slice(0, -1).join(" ");
        return updated.length > 0 ? updated + " " : updated;
      });
    } else if (key.length === 1) {
      addKey(key);
    } else if (key === "Backspace") {
      setUserInput((prev) => prev.slice(0, -1));
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
      textRef.current.scrollLeft = textRef.current.scrollWidth;
    }
  }, [userInput]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-[300px] overflow-hidden">
        <div
          ref={textRef}
          className="flex items-center whitespace-nowrap overflow-x-hidden scrollbar-none"
        >
          <div className="text-[3rem] leading-none">{userInput}</div>
          <div className="w-[4px] h-[2.5rem] bg-blue-500 ml-1 animate-blink flex-shrink-0" />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
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
