import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { useJournal } from "@/providers/JournalProvider";
import { toast } from "sonner";
import PasswordOTP from "./password-otp";

const LockedDialog = ({
  onOpenChange,
  onUnlock,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  onUnlock?: (key: CryptoKey | null) => void;
}) => {
  const { unlock } = useJournal();

  const handlePasswordChange = (value: string) => {
    if (value.length === 6) {
      handleUnlock(value);
    }
  };

  const handleUnlock = async (value: string) => {
    const key = await unlock(value);
    if (!key) {
      toast.error("Permission denied");
      if (onUnlock) onUnlock(null);
      return;
    }
    toast.success("Permission granted");
    if (onUnlock) onUnlock(key);
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <Dialog {...props} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit">
        <DialogHeader>
          <DialogTitle>Journal Locked</DialogTitle>
          <DialogDescription>
            Please enter your pin to unlock the journal
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <PasswordOTP onChange={handlePasswordChange} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onOpenChange?.(false)}
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LockedDialog;
