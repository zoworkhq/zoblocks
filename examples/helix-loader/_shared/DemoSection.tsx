import type { ReactNode } from "react";

/** Lays an example's cases out in a column. The page around it supplies the frame. */
export default function DemoSection({ children }: { children?: ReactNode }) {
  return <div className="grid w-full gap-6">{children}</div>;
}
