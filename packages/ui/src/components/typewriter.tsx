"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "../lib/utils";

interface TypewriterProps {
  text?: string;
  texts?: string[];
  speed?: number;
  deleteSpeed?: number;
  delay?: number;
  loop?: boolean;
  pause?: number;
  showCursor?: boolean;
  className?: string;
}

export function Typewriter({
  text,
  texts,
  speed = 50,
  deleteSpeed,
  delay = 0,
  loop = false,
  pause = 2000,
  showCursor = true,
  className,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const stopRef = useRef(false);

  // Resolve the list of strings to cycle through
  const allTexts: string[] = texts ?? (text ? [text] : []);
  // Stable ref to avoid re-running effect when parent re-renders
  const textsRef = useRef(allTexts);
  textsRef.current = allTexts;

  const eraseSpeed = deleteSpeed ?? Math.floor(speed / 2);

  useEffect(() => {
    if (textsRef.current.length === 0) return;

    stopRef.current = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeText = (str: string, onDone: () => void) => {
      let i = 0;
      const tick = () => {
        if (stopRef.current) return;
        i++;
        setDisplayed(str.slice(0, i));
        if (i < str.length) {
          timeoutId = setTimeout(tick, speed);
        } else {
          onDone();
        }
      };
      timeoutId = setTimeout(tick, speed);
    };

    const eraseText = (str: string, onDone: () => void) => {
      let i = str.length;
      const tick = () => {
        if (stopRef.current) return;
        i--;
        setDisplayed(str.slice(0, i));
        if (i > 0) {
          timeoutId = setTimeout(tick, eraseSpeed);
        } else {
          onDone();
        }
      };
      timeoutId = setTimeout(tick, eraseSpeed);
    };

    const runSequence = (textIndex: number) => {
      if (stopRef.current) return;
      const current = textsRef.current[textIndex];
      if (!current) return;

      typeText(current, () => {
        if (stopRef.current) return;
        const isLast = textIndex === textsRef.current.length - 1;

        if (!loop && isLast) return; // done

        timeoutId = setTimeout(() => {
          if (stopRef.current) return;
          eraseText(current, () => {
            if (stopRef.current) return;
            const nextIndex = isLast ? 0 : textIndex + 1;
            timeoutId = setTimeout(() => runSequence(nextIndex), 300);
          });
        }, pause);
      });
    };

    timeoutId = setTimeout(() => runSequence(0), delay);

    return () => {
      stopRef.current = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, eraseSpeed, delay, loop, pause]);

  return (
    <span className={cn("inline", className)}>
      {displayed}
      {showCursor && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "currentColor",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            animation: "tw-blink 0.7s step-end infinite",
          }}
        />
      )}
      {showCursor && (
        <style>{`@keyframes tw-blink { 50% { opacity: 0; } }`}</style>
      )}
    </span>
  );
}
