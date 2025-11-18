import { useEffect, useMemo, useState } from "react";
import TextCarousel from "./text-carousel";

export default function PreviewText({
  text,
  textColor,
  cursorColor,
}: {
  text: string;
  textColor: string;
  cursorColor: string;
}) {
  const [previewText, setPreviewText] = useState<string>("");
  const [previewIndex, setPreviewIndex] = useState(0);

  const tokens = useMemo(
    () => previewText.split(/(\s+)/).filter((t) => t.length > 0),
    [previewText]
  );

  useEffect(() => {
    if (previewIndex >= text.length) {
      const timeout = setTimeout(() => {
        setPreviewIndex(0);
        setPreviewText("");
      }, 2000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      setPreviewText(text.slice(0, previewIndex + 1));
      setPreviewIndex(previewIndex + 1);
    }, 100);

    return () => clearTimeout(timeout);
  }, [previewIndex]);

  return (
    <TextCarousel
      tokens={tokens || []}
      typing={true}
      userInput={previewText}
      textColor={textColor}
      cursorColor={cursorColor}
      size="sm"
    />
  );
}
