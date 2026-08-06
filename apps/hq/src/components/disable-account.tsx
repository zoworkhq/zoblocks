"use client";

import { useTransition } from "react";
import { ActionGate } from "@/components/oxygen/action-gate";
import { setUserStatus } from "@/lib/actions";

/**
 * Disabling an account is the one consequential act on this screen: it ends
 * every session that person holds on their next request. So it routes through
 * ActionGate rather than a bare button — the same component a customer would
 * put in front of a clinical action, doing the same job here.
 */
export function DisableAccount({ userId, name }: { userId: string; name: string }) {
  const [pending, start] = useTransition();

  return (
    <ActionGate
      action={`Disable ${name}`}
      consequence="They are signed out immediately and cannot sign in again until re-enabled. Their tasks and comments are kept."
      reversible
      mode="confirm"
      onConfirm={() =>
        start(async () => {
          const data = new FormData();
          data.set("userId", userId);
          data.set("status", "disabled");
          await setUserStatus(data);
        })
      }
    >
      <span className={pending ? "opacity-60" : undefined}>
        {pending ? "Disabling…" : "Disable"}
      </span>
    </ActionGate>
  );
}
