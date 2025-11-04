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
  onSubmit: (color: string | undefined) => void;
  value: string | undefined;
}

const ColorPicker = ({ onSubmit, value }: ColorPickerProps) => {
  const [color, setColor] = useState<string | undefined>(value);
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
          style={{ backgroundColor: value }}
        />
      </DialogTrigger>
      <DialogContent
        className="flex-1 justify-center"
        style={{ backgroundColor: color }}
      >
        <Card className="gap-4">
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

          <CardFooter className="flex-row gap-2">
            <DialogClose asChild>
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                onSubmit(color);
                setOpen(false);
              }}
              className="flex-1"
            >
              Save
            </Button>
          </CardFooter>
          <Button
            variant="link"
            size="sm"
            className="w-full font-normal"
            onClick={() => {
              onSubmit(undefined);
              setOpen(false);
            }}
          >
            Reset to default
          </Button>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
