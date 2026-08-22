"use client";

/**
 * One stage, ten features, switched by a tab.
 *
 * The alternative — ten stages stacked down the page, each looping — was tried
 * in the proposal and reads as a slot machine: every one competes for the same
 * attention and none of them wins. A tab strip makes the reader pick, which is
 * also the only honest way to show ten things that each take four seconds.
 */

import * as React from "react";
import { PRO_FEATURES, type StageId } from "@/lib/pro-features";
import { Stage } from "./stage-map";

export function FeatureBrowser() {
  const [active, setActive] = React.useState(0);
  const feature = PRO_FEATURES[active];
  if (!feature) return null;

  return (
    <div>
      <div className="fTabs" role="tablist" aria-label="Console features">
        {PRO_FEATURES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            id={`pro-tab-${f.id}`}
            aria-selected={i === active}
            aria-controls={`pro-pane-${f.id}`}
            onClick={() => setActive(i)}
          >
            {f.tab}
          </button>
        ))}
      </div>

      {/* Keyed on the feature so React remounts the pane, which restarts the
          stage's animation from its first frame rather than dropping the
          reader into the middle of a loop they did not see begin. */}
      <div
        key={feature.id}
        className="fPane"
        role="tabpanel"
        id={`pro-pane-${feature.id}`}
        aria-labelledby={`pro-tab-${feature.id}`}
      >
        <div>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
          <p className="fWhy">{feature.why}</p>
          <p className="gWhere">{feature.where}</p>
        </div>
        <div className="fStage seen">
          <Stage id={feature.id as StageId} />
        </div>
      </div>
    </div>
  );
}
