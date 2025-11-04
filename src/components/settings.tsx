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
import { useJournal } from "@/providers/JournalProvider";
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
import { ColorPicker } from "./ui/color-picker";
import PasswordOTP from "./ui/password-otp";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "./ui/field";

const SettingsSheet = ({ ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useIsMobile();
  const { settings, saveSettings } = useSettings();
  const [passwordDialogShown, setPasswordDialogShown] = useState(false);
  const [removeKeyDialogShown, setRemoveKeyDialogShown] = useState(false);
  const [password, setPassword] = useState("");
  const { enableEncryption, disableEncryption, lock, isUnlocked } =
    useJournal();
  const [openLockedDialog, setOpenLockedDialog] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const handleSavePassword = async (value: string) => {
    setLockLoading(true);
    const success = await enableEncryption(value);

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

  const handleChangeLockEnabled = async (checked: boolean, key?: CryptoKey) => {
    if (checked) {
      setPasswordDialogShown(true);
      return;
    }

    if (!isUnlocked && !key) {
      setOpenLockedDialog(true);
      return;
    }

    setLockLoading(true);
    try {
      await disableEncryption(key);
      await saveSettings({ lockEnabled: false });
      lock();
    } catch (error) {
      toast.error("An error occured while trying to unlock your journal");
      console.error(error);
    } finally {
      setLockLoading(false);
    }
  };

  const handleChangeCursorColor = async (color: string) => {
    await saveSettings({ cursorColor: color });
  };

  if (!settings) return null;

  return (
    <Sheet {...props}>
      <SheetContent side={isMobile ? "bottom" : "right"}>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Configure your journal experience</SheetDescription>
        </SheetHeader>

        <FieldGroup className="px-4">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Lock your jounal entries</FieldLabel>
              <FieldDescription>
                Enable encryption to protect your journal entries from
                unauthorized access.
              </FieldDescription>
            </FieldContent>
            <Switch
              checked={settings.lockEnabled}
              onCheckedChange={handleChangeLockEnabled}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Cursor color</FieldLabel>
              <FieldDescription>
                Change the color of the cursor in the journal.
              </FieldDescription>
            </FieldContent>
            <ColorPicker
              defaultValue={settings.cursorColor}
              onSubmit={handleChangeCursorColor}
            />
          </Field>
        </FieldGroup>
      </SheetContent>

      <Dialog open={passwordDialogShown} onOpenChange={setPasswordDialogShown}>
        <DialogContent className="w-fit">
          <DialogHeader>
            <DialogTitle>Password</DialogTitle>
            <DialogDescription>
              Enter your password to enable encryption
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <PasswordOTP secure={false} onChange={setPassword} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleSavePassword(password)}
              disabled={lockLoading}
              className="w-full"
            >
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
        onUnlock={async (key) => {
          if (key) {
            await handleChangeLockEnabled(false, key);
            setOpenLockedDialog(false);
          }
        }}
      />
    </Sheet>
  );
};

export default SettingsSheet;
