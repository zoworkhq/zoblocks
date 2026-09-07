import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Something the reader needs to know before they act.
 *
 * The structure is fixed — **what happened · what it affects · what to do** —
 * because a message that stops at the first is a message a customer cannot act
 * on. "Invalid colour" tells them nothing; "2.14:1 against text-on-accent,
 * below the 4.5:1 floor for SC 1.4.3, nearest passing #1A53A8" tells them
 * exactly how far off they are and where to go.
 *
 * `items` renders as a list so a validation failure with six problems does not
 * become one unreadable sentence.
 */
export function Callout({
  tone = "info",
  title,
  items,
  action,
  className,
  children,
}: {
  tone?: "info" | "fail" | "warn" | "pass";
  title: React.ReactNode;
  /** One per problem, each stating its own measurement. */
  items?: readonly React.ReactNode[];
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    /*
     * No `role="alert"`, deliberately.
     *
     * It had one, and once results also raised a toast that meant every failure
     * announced twice — the toast and this. An alert only announces on
     * *insertion* anyway, so on the screens where a `Callout` is rendered with
     * the page (a theme that already fails its gate) it never announced at all,
     * and on the screens where it appeared after an action it duplicated the
     * toast.
     *
     * So the toast is the announcement and this is the detail: content a reader
     * navigates to and works from, which is what it always actually was.
     */
    <div
      className={cn(
        "rounded-r-xl border border-l-[3px] px-4 py-3",
        tone === "info" && "border-rule border-l-zoblocks bg-paper",
        tone === "fail" && "border-fail/25 border-l-fail bg-fail-wash",
        tone === "warn" && "border-warn/25 border-l-warn bg-warn-wash",
        tone === "pass" && "border-pass/25 border-l-pass bg-pass-wash",
        className,
      )}
    >
      <p
        className={cn(
          "text-[0.8125rem] font-semibold",
          tone === "fail" && "text-fail",
          tone === "warn" && "text-warn",
          tone === "pass" && "text-pass",
        )}
      >
        {title}
      </p>

      {children && <div className="body-sm mt-1 text-graphite">{children}</div>}

      {items && items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={index} className="tabular flex gap-2 text-[0.75rem] leading-relaxed">
              <AlertTriangle
                aria-hidden="true"
                strokeWidth={2}
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  tone === "fail" ? "text-fail" : "text-graphite-soft",
                )}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
