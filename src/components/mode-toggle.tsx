import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle({ ...props }: React.ComponentProps<typeof Button>) {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    let nextTheme: "dark" | "light";
    if (theme === "system") {
      nextTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "light"
        : "dark";
    } else {
      nextTheme = theme === "dark" ? "light" : "dark";
    }
    setTheme(nextTheme);
  };

  return (
    <Button {...props} variant="ghost" size="icon" onClick={handleToggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
