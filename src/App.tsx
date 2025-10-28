import { useEffect, useRef, useState, useCallback } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function App() {
  const [userInput, setUserInput] = useState("");
  const [showButton, setShowButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    setShowMenu(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setShowMenu(false);
    }, 1000);
  };

  const addKey = (key: string) => {
    setUserInput((prev) => prev + key);
  };

  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    const { key, ctrlKey } = event;

    if (key === " " || key === "Spacebar") {
      event.preventDefault();
      addKey(key);
    } else if (ctrlKey && key === "Backspace") {
      setUserInput((prev) => {
        if (prev[prev.length - 1] === " ") return prev;
        const trimmed = prev.trimEnd();
        const updated = trimmed.split(" ").slice(0, -1).join(" ");
        return updated.length > 0 ? updated + " " : updated;
      });
    } else if (key.length === 1) {
      addKey(key);
    } else if (key === "Backspace") {
      setUserInput((prev) =>
        prev[prev.length - 1] === " " ? prev : prev.slice(0, -1)
      );
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
    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (userInput.length > 0) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [userInput]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-[500px] text-center">
        <div className="relative max-w-[500px] overflow-hidden whitespace-nowrap inline-block p-[5px]">
          <div
            className="text-[4rem] inline-block transition-all duration-300 ease-out"
            style={{
              transform: `translateX(calc(min(0px, 500px - 100%)))`,
            }}
          >
            {userInput}
            <span
              className="text-[#3f85e8] animate-pulse"
              style={{ fontSize: "inherit" }}
            >
              |
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-5">
        <Button
          variant="default"
          className="transition-opacity duration-300"
          style={{ opacity: showButton ? 1 : 0 }}
          disabled={!showButton}
          onClick={done}
        >
          Done
        </Button>
        <Button
          variant="outline"
          className="transition-opacity duration-300"
          style={{ opacity: showButton ? 1 : 0 }}
          disabled={!showButton}
          onClick={reset}
        >
          Reset
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-[50px] left-[50px] p-2 transition-opacity duration-300",
          showMenu ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setShowMenu(!showMenu)}
      >
        <MenuIcon size={25} className="block" />
      </Button>
    </div>
  );
}

export default App;
