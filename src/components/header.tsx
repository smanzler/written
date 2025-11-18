import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "./ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { useJournal } from "@/providers/JournalProvider";
import { Lock, Settings, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { useSettings } from "@/providers/SettingsProvider";
import LockedDialog from "./ui/locked-dialog";
import { useState } from "react";
import SettingsSheet from "./settings";

const Header = () => {
  const isMobile = useIsMobile();
  const { isUnlocked, lock } = useJournal();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const { settings } = useSettings();
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <header className="w-full flex h-16 shrink-0 items-center gap-2 px-4 sticky top-0 bg-background">
      {isMobile && <SidebarTrigger />}
      <div className="ml-auto flex flex-row">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenSettings(true)}
        >
          <Settings />
        </Button>
        {settings.lockEnabled &&
          (isUnlocked ? (
            <Button variant="ghost" onClick={lock}>
              <Unlock />
            </Button>
          ) : (
            <Button variant="default" onClick={() => setOpenLockedDialog(true)}>
              <Lock />
            </Button>
          ))}
        <ModeToggle variant="ghost" />
      </div>
      <LockedDialog
        open={openLockedDialog}
        onOpenChange={setOpenLockedDialog}
      />
      <SettingsSheet open={openSettings} onOpenChange={setOpenSettings} />
    </header>
  );
};

export default Header;
