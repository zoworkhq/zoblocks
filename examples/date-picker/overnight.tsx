import { SessionTimeField } from "@/components/zoblocks/date-picker";

import { plainTime, sessionFrom, withSessionEnd } from "@/lib/zoblocks-datetime";

// --------------------------------------------------
// 1. VALID OVERNIGHT SESSION
// --------------------------------------------------

// Starts at 11:30 PM and ends at 7:30 AM the next day.
// Duration: 8 hours.
const overnightSession = withSessionEnd(sessionFrom(plainTime(23, 30), 0), plainTime(7, 30), {
  allowOvernight: true,
});

// --------------------------------------------------
// 2. SESSION EXCEEDING MAXIMUM DURATION
// --------------------------------------------------

// Starts at 9:00 AM and ends at 2:00 AM the next day.
// Duration: 17 hours.
// The component should suggest 2:00 PM as the likely correction.
const excessiveSession = withSessionEnd(sessionFrom(plainTime(9, 0), 0), plainTime(2, 0), {
  allowOvernight: true,
});

export default function OvernightAndGuardExample() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <SessionTimeField
        label="Crisis line shift"
        defaultValue={overnightSession}
        maxMinutes={480}
        allowOvernight
        startDateLabel="Aug 26"
        nextDateLabel="Aug 27"
      />

      {/* ------------------------------------- */}
      {/* 2. MAXIMUM-DURATION GUARD              */}
      {/* ------------------------------------- */}

      <SessionTimeField
        label="Crisis line shift"
        defaultValue={excessiveSession}
        maxMinutes={480}
        allowOvernight
        startDateLabel="Aug 26"
        nextDateLabel="Aug 27"
      />
    </main>
  );
}
