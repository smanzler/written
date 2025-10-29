import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";

function App() {
  const [userInput, setUserInput] = useState("");

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
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <SidebarProvider>
      <AppSidebar variant="floating" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-col items-center justify-center h-full">
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
              onClick={done}
            >
              Done
            </Button>
            <Button
              variant="outline"
              className="transition-opacity duration-300"
              onClick={reset}
            >
              Reset
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
