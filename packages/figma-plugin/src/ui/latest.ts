/**
 * Only the newest request may write.
 *
 * Two theme picks in quick succession are two requests that can land in
 * either order. Without this, a slow answer for A replaced B's payload, and
 * Apply sent A while the preview on screen was B's.
 */

export interface LatestOnly {
  /** Start a request. The returned check is true until a later one begins. */
  begin(): () => boolean;
  /** Stale everything in flight. */
  cancel(): void;
}

export function latestOnly(): LatestOnly {
  let current = 0;
  return {
    begin() {
      current += 1;
      const id = current;
      return () => id === current;
    },
    cancel() {
      current += 1;
    },
  };
}
