import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";

function getRainbowColor(index: number): string {
  const hue = (index * 10) % 360;
  return `hsl(${hue}, 100%, 50%)`;
}

type Size = "sm" | "md";

interface TextCarouselProps {
  tokens: string[];
  typing?: boolean;
  isFocused?: boolean;
  userInput: string;
  textColor: string;
  cursorColor: string;
  focusInput?: () => void;
  size?: Size;
}

const sizeClasses = {
  sm: {
    text: "text-[2rem]",
    height: "h-24",
    cursor: "w-1 h-8",
  },
  md: {
    text: "text-[4rem]",
    height: "h-24",
    cursor: "w-1 h-16",
  },
};

export default function TextCarousel({
  tokens,
  typing,
  isFocused,
  userInput,
  textColor,
  cursorColor,
  focusInput,
  size = "md",
}: TextCarouselProps) {
  const [translateX, setTranslateX] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (textRef.current) {
      const width = textRef.current.scrollWidth;
      const translate = -width;
      setTranslateX(translate);
    }
  }, [userInput]);
  return (
    <div
      className="relative w-0 whitespace-nowrap text-center"
      onTouchStart={focusInput}
      onClick={focusInput}
    >
      <motion.div
        ref={textRef}
        className={cn(
          sizeClasses[size].text,
          sizeClasses[size].height,
          "inline-flex items-center whitespace-pre"
        )}
        style={{ color: textColor }}
        animate={{ x: translateX }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
        }}
      >
        {(() => {
          let cumulativeIndex = 0;

          return tokens.map((token, index) => {
            const startIndex = cumulativeIndex;
            cumulativeIndex += token.length;

            return (
              <motion.span
                key={index}
                animate={{
                  opacity: index >= tokens.length - (typing ? 1 : 2) ? 1 : 0,
                  visibility:
                    index < tokens.length - (typing ? 1 : 2)
                      ? "hidden"
                      : "visible",
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                {textColor === "rainbow"
                  ? token.split("").map((char, charIndex) => (
                      <span
                        key={charIndex}
                        style={{
                          color: getRainbowColor(startIndex + charIndex),
                        }}
                      >
                        {char}
                      </span>
                    ))
                  : token}
              </motion.span>
            );
          });
        })()}
        <motion.span
          animate={{
            opacity:
              isFocused === undefined || isFocused === true ? [1, 0.4, 1] : 0,
          }}
          transition={
            isFocused === undefined || isFocused === true
              ? {
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }
              : {
                  duration: 0.1,
                  ease: "easeInOut",
                }
          }
          className={cn("ml-1 rounded-full", sizeClasses[size].cursor)}
          style={{ backgroundColor: cursorColor }}
        />
      </motion.div>
    </div>
  );
}
