import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "./ui/sidebar";
import { useJournalStore } from "@/stores/journalStore";
import { Lock, Settings, Unlock } from "lucide-react";
import { Button } from "./ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import LockedDialog from "./ui/locked-dialog";
import { useState } from "react";
import { Link } from "react-router";

const Header = () => {
  const isMobile = useIsMobile();
  const { isUnlocked, lock } = useJournalStore();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const { settings } = useSettingsStore();

  return (
    <header className="w-full flex h-16 shrink-0 items-center gap-2 px-4 sticky top-0 bg-background z-2">
      {isMobile && <SidebarTrigger />}
      <div className="ml-auto flex flex-row">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/settings">
            <Settings />
          </Link>
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
      </div>
      <LockedDialog
        open={openLockedDialog}
        onOpenChange={setOpenLockedDialog}
      />
    </header>
  );
};

export default Header;
