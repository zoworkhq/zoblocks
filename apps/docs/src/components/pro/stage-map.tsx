import type { StageId } from "@/lib/pro-features";
import {
  StageBridge,
  StageDensity,
  StageFigma,
  StageGate,
  StageHistory,
  StageMarket,
  StagePin,
  StageRamp,
  StageRoles,
  StageVision,
} from "./stages";

/**
 * Stage id to stage.
 *
 * Keyed by the union rather than by string, so adding a feature without
 * building its glance is a type error instead of an empty box on the page.
 */
const BY_ID: Record<StageId, () => React.JSX.Element> = {
  history: StageHistory,
  gate: StageGate,
  ramp: StageRamp,
  pin: StagePin,
  vision: StageVision,
  density: StageDensity,
  bridge: StageBridge,
  figma: StageFigma,
  roles: StageRoles,
  market: StageMarket,
};

export function Stage({ id }: { id: StageId }) {
  const Body = BY_ID[id];
  return <Body />;
}
