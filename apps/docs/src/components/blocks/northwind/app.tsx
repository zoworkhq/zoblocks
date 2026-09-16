"use client";

import { NorthwindApp, type Route, type Screen } from "./shell";
import { DashboardScreen } from "./screens/dashboard";
import { CaseloadScreen } from "./screens/caseload";
import { ScheduleScreen } from "./screens/schedule";
import { MessagesScreen } from "./screens/messages";
import { ReportsScreen } from "./screens/reports";
import { PatientsScreen } from "./screens/patients";
import { InstrumentsScreen } from "./screens/instruments";
import { SafetyScreen } from "./screens/safety";
import { RecordScreen } from "./screens/record";
import { NoteScreen } from "./screens/note";
import { CopilotScreen } from "./screens/copilot";

const SCREENS: Record<Screen, () => React.JSX.Element> = {
  dashboard: DashboardScreen,
  caseload: CaseloadScreen,
  schedule: ScheduleScreen,
  messages: MessagesScreen,
  reports: ReportsScreen,
  patients: PatientsScreen,
  instruments: InstrumentsScreen,
  safety: SafetyScreen,
  record: RecordScreen,
  note: NoteScreen,
  copilot: CopilotScreen,
};

/** The whole application, opened at one route. */
export function Northwind({ initial }: { initial: Route }) {
  return <NorthwindApp initial={initial} screens={SCREENS} />;
}
