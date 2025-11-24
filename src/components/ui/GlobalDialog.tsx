import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ButtonsDialogOptions,
  PasswordDialogOptions,
  useDialogStore,
} from "@/stores/dialogStore";
import PasswordOTP from "./password-otp";
import { useState } from "react";

function ButtonsVariantDialogContent({
  title,
  description,
  buttons,
  closeDialog,
}: ButtonsDialogOptions & { closeDialog: (value: any) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div className="flex justify-end gap-2 mt-4">
        {buttons.map((btn, idx) => (
          <Button
            key={idx}
            variant={btn.variant || "default"}
            onClick={() => closeDialog(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
      </div>
    </>
  );
}

function PasswordVariantDialogContent({
  title,
  description,
  closeDialog,
}: PasswordDialogOptions & { closeDialog: (value: any) => void }) {
  const [password, setPassword] = useState("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex flex-col items-center">
        <PasswordOTP onChange={setPassword} />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={() => closeDialog(null)}>
          Close
        </Button>
        <Button onClick={() => closeDialog(password)}>Unlock</Button>
      </DialogFooter>
    </>
  );
}

export function GlobalDialog() {
  const { isOpen, content, closeDialog, clearContent } = useDialogStore();

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog(null)}>
      <DialogContent
        onAnimationEnd={(e) => {
          console.log("clearing", e.animationName);
          if (
            e.animationName.includes("exit") ||
            e.animationName.includes("out")
          ) {
            clearContent();
          }
        }}
      >
        {content.type === "buttons" && (
          <ButtonsVariantDialogContent
            {...content.props}
            closeDialog={closeDialog}
          />
        )}
        {content.type === "password" && (
          <PasswordVariantDialogContent
            {...content.props}
            closeDialog={closeDialog}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
