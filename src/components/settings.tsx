import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useJournal } from "@/providers/JournalProvider";
import { Label } from "./ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/providers/SettingsProvider";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import LockedDialog from "./ui/locked-dialog";
import { Spinner } from "./ui/spinner";

const SettingsSheet = ({ ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useIsMobile();
  const { settings, saveSettings } = useSettings();
  const [passwordDialogShown, setPasswordDialogShown] = useState(false);
  const [removeKeyDialogShown, setRemoveKeyDialogShown] = useState(false);
  const [password, setPassword] = useState("");
  const { enableEncryption, disableEncryption } = useJournal();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const handleSavePassword = async () => {
    setLockLoading(true);
    const success = await enableEncryption(password);

    if (!success) {
      setLockLoading(false);
      setRemoveKeyDialogShown(true);
      return;
    }

    await saveSettings({ lockEnabled: true });
    setPasswordDialogShown(false);
    setLockLoading(false);
  };

  const handleRemoveKey = async () => {
    setLockLoading(true);
    const success = await enableEncryption(password, true);

    if (!success) {
      toast.error("An error occured while trying to create your password");
      setLockLoading(false);
      return;
    }

    await saveSettings({ lockEnabled: true });
    setRemoveKeyDialogShown(false);
    setPasswordDialogShown(false);
    setLockLoading(false);
  };

  const handleChangeLockEnabled = async (checked: boolean) => {
    if (checked) {
      setPasswordDialogShown(true);
      return;
    }

    setLockLoading(true);
    try {
      await disableEncryption();
      await saveSettings({ lockEnabled: false });
    } catch (error) {
      toast.error("An error occured while trying to unlock your journal");
      console.error(error);
    } finally {
      setLockLoading(false);
    }
  };

  if (!settings) return null;

  return (
    <Sheet {...props}>
      <SheetContent side={isMobile ? "bottom" : "right"}>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Configure your journal experience</SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <Label>Lock your jounal entries</Label>
          <Switch
            checked={settings.lockEnabled}
            onCheckedChange={handleChangeLockEnabled}
          />

          <Label>Cursor color</Label>
          {/* color picker */}

          <Button onClick={() => setOpenLockedDialog(true)}>Unlock</Button>
        </div>
      </SheetContent>

      <Dialog open={passwordDialogShown} onOpenChange={setPasswordDialogShown}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password</DialogTitle>
          </DialogHeader>
          <Input onChange={(e) => setPassword(e.target.value)} />
          <DialogFooter>
            <Button onClick={handleSavePassword} disabled={lockLoading}>
              {lockLoading && <Spinner />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeKeyDialogShown}
        onOpenChange={setRemoveKeyDialogShown}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detected existing key</DialogTitle>
            <DialogDescription>
              Are you sure you would like to proceed? This will remove the
              current key which could lose all of your currently locked journal
              entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setRemoveKeyDialogShown(false);
                setPasswordDialogShown(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                setRemoveKeyDialogShown(false);
                setPasswordDialogShown(false);
                await saveSettings({ lockEnabled: true });
              }}
            >
              Continue without removing key
            </Button>
            <Button onClick={handleRemoveKey} disabled={lockLoading}>
              {lockLoading && <Spinner />}Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LockedDialog
        open={openLockedDialog}
        onOpenChange={setOpenLockedDialog}
        onUnlock={() => {
          console.log("unlock");
        }}
      />
    </Sheet>
  );
};

export default SettingsSheet;
