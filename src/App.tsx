/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [userInput, setUserInput] = useState("");
  const [showButton, setShowButton] = useState(false);

  const addKey = (key: string) => {
    setUserInput((prev) => prev + key);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
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
      console.log(key);
    }
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
