"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Card, CardContent, CardFooter, CardHeader } from "./card";

interface ColorPickerProps {
  onSubmit: (color: string) => void;
  defaultValue: string;
}

const ColorPicker = ({ onSubmit, defaultValue }: ColorPickerProps) => {
  const [color, setColor] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setOpen(true);
          }}
          variant="outline"
          size="icon-sm"
          style={{ backgroundColor: color }}
        />
      </DialogTrigger>
      <DialogContent
        className="flex-1 justify-center"
        style={{ backgroundColor: color }}
      >
        <Card>
          <CardHeader>
            <DialogTitle>Color Picker</DialogTitle>
            <DialogDescription>
              Select a color to use in your journal.
            </DialogDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 w-full">
            <HexColorPicker color={color} onChange={setColor} />
            <Input
              maxLength={7}
              onChange={(e) => {
                setColor(e?.currentTarget?.value);
              }}
              value={color}
            />
          </CardContent>

          <CardFooter className="flex flex-row gap-2 justify-end">
            <DialogClose asChild>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                onSubmit(color);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
