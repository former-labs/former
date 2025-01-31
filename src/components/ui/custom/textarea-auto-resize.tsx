"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type ComponentProps, forwardRef, useEffect, useRef } from "react";

export const TextareaAutoResize = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<typeof Textarea> & {
    value: string;
  }
>(({ value, ...props }, forwardedRef) => {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef =
    (forwardedRef as React.RefObject<HTMLTextAreaElement>) ?? localRef;

  useEffect(() => {
    requestAnimationFrame(() => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = "auto";
        // The min height of 32px is a hack for a text area shrinking bug
        const height = Math.max(textAreaRef.current.scrollHeight, 48);
        textAreaRef.current.style.height = `${height}px`;
      }
    });
  }, [value, textAreaRef]);

  return (
    <Textarea
      ref={textAreaRef}
      value={value}
      {...props}
      className={cn("min-h-0 resize-none overflow-hidden", props.className)}
    />
  );
});

TextareaAutoResize.displayName = "TextareaAutoResize";
