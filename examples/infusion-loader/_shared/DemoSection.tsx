import type { ReactNode } from "react";

/** Centres an example's loader. The page around it supplies the frame. */
export default function DemoSection({ children }: { children?: ReactNode }) {
  return <div className="flex w-full items-center justify-center">{children}</div>;
}
