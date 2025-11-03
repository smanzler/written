import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import { useJournal } from "@/providers/JournalProvider";
import { toast } from "sonner";

const LockedDialog = ({
  onOpenChange,
  onUnlock,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  onUnlock?: (key: CryptoKey | null) => void;
}) => {
  const [password, setPassword] = useState("");

  const { unlock } = useJournal();

  const handleUnlock = async () => {
    const key = await unlock(password);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Journal Locked</DialogTitle>
          <DialogDescription>
            Please enter your pin to unlock the journal
          </DialogDescription>
        </DialogHeader>
        <Label htmlFor="pin-input">Pin</Label>
        <Input
          id="pin-input"
          autoComplete="off"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleUnlock();
            }
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={() => onOpenChange?.(false)}>
              Close
            </Button>
          </DialogClose>
          <Button onClick={handleUnlock}>Unlock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LockedDialog;
