"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

/**
 * Copy, and say so.
 *
 * The confirmation happens *in the button* rather than in a toast: the reader
 * is looking at the button, they clicked it, and a message appearing in a
 * corner of the screen is a message half of them will miss. It reverts after
 * two seconds so the control does not lie about its next action.
 *
 * The live region is polite and separate, because the label change alone is not
 * announced by every screen reader.
 */
export function CopyButton({
  value,
  children = "Copy",
  variant = "secondary",
}: {
  value: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          } catch {
            // A denied clipboard permission is the user's choice, not an error
            // worth interrupting them over. The value is on screen to select.
          }
        }}
      >
        {copied ? "Copied" : children}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
