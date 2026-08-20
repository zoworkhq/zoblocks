"use client";

import { Failure } from "@/components/Failure";

/**
 * Errors inside the console, rendered inside the console.
 *
 * `error.tsx` does not wrap the layout in its own segment, so this renders in
 * place of the page with the rail and the account bar still around it. That is
 * the whole reason it lives here rather than only at the root: a reader whose
 * theme screen failed can still reach Members, or sign out, without the
 * browser's back button.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Failure
      error={error}
      retry={retry}
      title="This screen did not load"
      back={{ href: "/themes", label: "Back to themes" }}
    >
      Nothing was saved and nothing was published. Most failures here are a request that did not
      land, so trying again is usually enough.
    </Failure>
  );
}
