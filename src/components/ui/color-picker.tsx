"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface ColorPickerProps {
  onSubmit: (color: string | undefined) => void;
  state: string | undefined;
  fallbackColor: string;
  onColorChange: (color: string | undefined) => void;
}

const ColorPicker = ({
  onSubmit,
  state,
  fallbackColor,
  onColorChange,
}: ColorPickerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          onColorChange(undefined);
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          onClick={() => {
            setOpen(true);
          }}
          variant="outline"
          size="icon-sm"
          style={{ backgroundColor: state || fallbackColor }}
        />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2 justify-center w-fit">
        <HexColorPicker
          color={state || fallbackColor}
          onChange={onColorChange}
        />
        <Input
          maxLength={7}
          onChange={(e) => {
            onColorChange(e?.currentTarget?.value);
          }}
          value={state || fallbackColor}
          className="w-full"
        />

        <div className="flex flex-row gap-2 w-full">
          <Button
            variant="secondary"
            onClick={() => {
              onColorChange(fallbackColor);
              setOpen(false);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(state);
              setOpen(false);
            }}
            className="flex-1"
          >
            Save
          </Button>
        </div>
        <Button
          variant="link"
          size="sm"
          className="w-full font-normal"
          onClick={() => {
            onSubmit(undefined);
            onColorChange(undefined);
            setOpen(false);
          }}
        >
          Reset to default
        </Button>
      </PopoverContent>
    </Popover>
  );
};

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
