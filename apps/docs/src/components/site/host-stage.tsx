"use client";

/**
 * Mounts whichever framework the reader picked, around the preview.
 *
 * Two things happen here and they are separate. The host **provider** supplies
 * the chrome primitives a demo asks for through `useHost()`; the host
 * **bridge** writes that framework's resolved theme onto `--zb-*`, so the
 * ZoBlocks components inside restyle without importing anything. A reader who
 * switches to Material UI gets MUI's real Button — ripple and all — beside an
 * ZoBlocks ResultValue wearing MUI's palette, which is what a customer's screen
 * actually looks like.
 *
 * **Lazily, and that is structural rather than an optimisation.** Measured
 * against the installed packages: antd's seven components with
 * `ConfigProvider` are 142 KB gzipped and MUI's are 76 KB. Static imports
 * would put 218 KB into the shared chunk of a site whose default state needs
 * neither.
 *
 * `React.lazy` rather than `next/dynamic`, for one reason that decides it:
 * `next/dynamic`'s `loading` renders *instead of* the subtree and receives no
 * children, so the preview would blank for the length of the download. A
 * Suspense fallback can render the same children under the ZoBlocks host, so the
 * component stays on screen and only its chrome changes when the chunk lands.
 *
 * Neither framework is ever imported on the server. The language store reports
 * `"zoblocks"` during SSR and the first client render — see `design-language.ts`
 * — so the two branches below are unreachable until after hydration, and the
 * cssinjs and emotion style registries a server-rendered antd or MUI tree
 * would need never come into it.
 */

import * as React from "react";
import { ZoBlocksHost } from "@zoblocks/host-react";
import { useDesignLanguage } from "@/lib/design-language";
import { useSiteTheme } from "./use-site-theme";

// `loaded` rather than `module`: Next forbids assigning that identifier,
// because a bundler-injected `module` in the same scope would be shadowed.
const AntdHost = React.lazy(async () => {
  const loaded = await import("@zoblocks/host-react/antd");
  return { default: loaded.AntdHost };
});

const MuiHost = React.lazy(async () => {
  const loaded = await import("@zoblocks/host-react/mui");
  return { default: loaded.MuiHost };
});

export function HostStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const language = useDesignLanguage();
  const mode = useSiteTheme() ? "dark" : "light";

  /*
   * The fallback is the ZoBlocks host, not a spinner.
   *
   * A preview that empties while 142 KB downloads is worse than one that
   * shows the same component in our own chrome for a moment: the component is
   * what is being demonstrated either way, and it never disappears.
   */
  const fallback = (
    <ZoBlocksHost mode={mode} className={className}>
      {children}
    </ZoBlocksHost>
  );

  if (language === "antd") {
    return (
      <React.Suspense fallback={fallback}>
        <AntdHost mode={mode} className={className}>
          {children}
        </AntdHost>
      </React.Suspense>
    );
  }

  if (language === "mui") {
    return (
      <React.Suspense fallback={fallback}>
        <MuiHost mode={mode} className={className}>
          {children}
        </MuiHost>
      </React.Suspense>
    );
  }

  return fallback;
}
