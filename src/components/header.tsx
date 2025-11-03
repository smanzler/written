import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "./ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { useJournal } from "@/providers/JournalProvider";
import { Lock, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { useSettings } from "@/providers/SettingsProvider";

const Header = () => {
  const isMobile = useIsMobile();
  const { isUnlocked, setShowLockedDialog, lock } = useJournal();
  const { settings } = useSettings();

  return (
    <header className="w-full flex h-16 shrink-0 items-center gap-2 px-4 sticky top-0 bg-background">
      {isMobile && <SidebarTrigger />}
      <div className="ml-auto flex flex-row">
        {settings?.lockEnabled &&
          (isUnlocked ? (
            <Button variant="ghost" onClick={lock}>
              <Unlock />
            </Button>
          ) : (
            <Button variant="default" onClick={() => setShowLockedDialog(true)}>
              <Lock />
            </Button>
          ))}
        <ModeToggle variant="ghost" />
      </div>
    </header>
  );
};

export default Header;
