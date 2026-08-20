"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button, buttonClasses } from "./Button";

/**
 * Saving generated text as a file.
 *
 * A Blob and an object URL rather than a `data:` href. Two reasons, and the
 * second is the one that bites: a `data:` URL puts the whole payload in the
 * DOM, and a theme export is tens of kilobytes of text that then shows up in
 * every DOM snapshot and every accessibility tree; and Safari has historically
 * refused `download` on `data:` hrefs above a size that a CSS export clears
 * comfortably.
 *
 * The URL is revoked on unmount. Without that, every visit to the transfer
 * screen leaks one blob per format for the lifetime of the tab.
 */
export function DownloadButton({
  filename,
  contents,
  type = "text/plain",
  children = "Download",
}: {
  filename: string;
  contents: string;
  type?: string;
  children?: React.ReactNode;
}) {
  const [href, setHref] = useState<string>();
  const previous = useRef<string | undefined>(undefined);

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    if (previous.current) URL.revokeObjectURL(previous.current);
    previous.current = url;
    setHref(url);

    return () => {
      URL.revokeObjectURL(url);
      previous.current = undefined;
    };
  }, [contents, type]);

  /*
   * Rendered as a disabled-looking button until the effect has run.
   *
   * An anchor with no `href` is not a link — it drops out of the tab order and
   * a screen reader announces it as text. One paint without a URL is
   * unavoidable because `URL.createObjectURL` needs a browser, so the fallback
   * has to be a real control rather than a broken link.
   */
  if (!href) {
    return (
      <Button type="button" variant="secondary" size="sm" disabled>
        <Download aria-hidden="true" className="size-3.5" />
        {children}
      </Button>
    );
  }

  return (
    // The kit's own classes, not a copy of them. This anchor had a hand-written
    // duplicate of the secondary variant, which would have drifted from it the
    // first time the variant changed.
    <a
      href={href}
      download={filename}
      className={buttonClasses({ variant: "secondary", size: "sm" })}
    >
      <Download aria-hidden="true" className="size-3.5" />
      {children}
      <span className="sr-only"> {filename}</span>
    </a>
  );
}
