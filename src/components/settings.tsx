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
import { db } from "@/lib/db";
import LockedDialog from "./ui/locked-dialog";

const SettingsSheet = ({ ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useIsMobile();
  const { settings, saveSettings } = useSettings();
  const [passwordDialogShown, setPasswordDialogShown] = useState(false);
  const [removeKeyDialogShown, setRemoveKeyDialogShown] = useState(false);
  const [password, setPassword] = useState("");
  const { createPassword, encryptText, decryptText } = useJournal();
  const [loading, setLoading] = useState(false);
  const [openLockedDialog, setOpenLockedDialog] = useState(false);

  const encryptEntries = async () => {
    const entries = await db.journals.toArray();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        const result = await encryptText(entry.content);
        return {
          key: entry.id,
          changes: { content: JSON.stringify(result) },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  const decryptEntries = async () => {
    const entries = await db.journals.toArray();

    const updates = await Promise.all(
      entries.map(async (entry) => {
        const { cipher, iv } = JSON.parse(entry.content);
        const result = await decryptText(cipher, iv);
        return {
          key: entry.id,
          changes: { content: result },
        };
      })
    );

    await db.journals.bulkUpdate(updates);
  };

  const handleSavePassword = async () => {
    const success = await createPassword(password);

    if (!success) {
      setRemoveKeyDialogShown(true);
      return;
    }

    await encryptEntries();

    saveSettings({ lockEnabled: true });
  };

  const handleRemoveKey = async () => {
    const success = await createPassword(password, true);

    if (!success) {
      toast.error("An error occured while trying to create your password");
      return;
    }

    await encryptEntries();

    saveSettings({ lockEnabled: true });

    setRemoveKeyDialogShown(false);
    setPasswordDialogShown(false);
  };

  console.log(settings);

  const handleChangeLockEnabled = async (checked: boolean) => {
    if (checked) {
      setPasswordDialogShown(true);
      return;
    }

    setLoading(true);
    // decode all entries
    try {
      await decryptEntries();
      await saveSettings({ lockEnabled: false });
    } catch (error) {
      toast.error("An error occured while trying to unlock your journal");
      console.error(error);
    } finally {
      setLoading(false);
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

          <Button onClick={encryptEntries} disabled={loading}>
            Mock Lock All
          </Button>
          <Button onClick={decryptEntries} disabled={loading}>
            Mock Unlock All
          </Button>

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
            <Button onClick={handleSavePassword}>Save</Button>
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
            <Button onClick={handleRemoveKey}>Confirm</Button>
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
