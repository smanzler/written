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
  ...props
}: React.ComponentProps<typeof Dialog>) => {
  const [password, setPassword] = useState("");

  const { unlock } = useJournal();

  const handleUnlock = async () => {
    const success = await unlock(password);
    if (!success) {
      toast.error("Permission denied");
      return;
    }
    toast.success("Permission granted");
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Journal Locked</DialogTitle>
          <DialogDescription>
            Please enter your pin to unlock the journal
          </DialogDescription>
        </DialogHeader>
        <Label>Pin</Label>
        <Input onChange={(e) => setPassword(e.target.value)} />
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
          <Button onClick={handleUnlock}>Unlock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LockedDialog;
