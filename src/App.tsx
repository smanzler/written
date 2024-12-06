/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import "./App.css";
import { db } from "./db/db";
import { JournalDates } from "./components/JournalDates";

function App() {
  const [userInput, setUserInput] = useState("");
  const [showButton, setShowButton] = useState(false);

  const addKey = (key: string) => {
    setUserInput((prev) => prev + key);
  };

  const handleKeyPress = async (event: KeyboardEvent) => {
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
  };

  const done = async () => {
    setUserInput((currentInput) => {
      const trimmedInput = currentInput.trim();
      if (!trimmedInput) {
        return currentInput;
      }

      try {
        db.journals.add({
          text: trimmedInput,
          created_at: new Date(new Date().setDate(new Date().getDate() + 3)),
          updated_at: new Date(new Date().setDate(new Date().getDate() + 3)),
        });

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

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  useEffect(() => {
    if (userInput.length > 0) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [userInput]);

  return (
    <>
      <JournalDates />
      <div className="mask-container">
        <div className="typing-container">
          <div className="typing-text">
            {userInput}
            <span id="cursor">|</span>
          </div>
        </div>
      </div>
      <div className="button-container">
        <button
          type="button"
          className="done-button"
          style={{ opacity: showButton ? 1 : 0 }}
          onClick={done}
        >
          Done
        </button>
        <button
          type="button"
          className="reset-button"
          style={{ opacity: showButton ? 1 : 0 }}
          onClick={reset}
        >
          Reset
        </button>
      </div>
    </>
  );
}

export default App;
