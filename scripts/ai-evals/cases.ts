/**
 * The prompts an agent is evaluated on (ADR 0017's testing plan), each with
 * what a correct answer must contain.
 *
 * Phrased the way a developer types, not the way a test would — "add a
 * Switch", "convert this", "show this lab result" — because that is the
 * input the skill has to cope with. Several are traps on purpose: a login
 * form needs components ZoBlocks does not ship, and the right answer uses
 * none of its imports rather than inventing them.
 */

export interface EvalCase {
  id: string;
  prompt: string;
  /** The app the agent starts in. `antd` adds Ant Design to the Next.js template. */
  fixture: "next-app" | "next-app-antd";
  /** Files to seed before the agent starts, relative to the app. */
  seed?: Record<string, string>;
  /** Catalog components a correct answer uses. */
  expect: string[];
  /** At least one of these must be used — for when several are right. */
  expectOneOf?: string[];
  /** Source a correct answer must contain somewhere, with why. */
  mustContain?: Array<{ pattern: RegExp; why: string }>;
}

const SETTINGS_PAGE = `export default function SettingsPage() {
  return (
    <form>
      <h1>Encounter settings</h1>
      <label>
        <input type="checkbox" name="contact" /> Contact precautions
      </label>
      <button type="submit">Save</button>
    </form>
  );
}
`;

const LEGACY_PAGE = `export default function PatientPage() {
  const loading = true;
  return (
    <main>
      {loading ? <div className="spinner" aria-label="Loading" /> : null}
      <span style={{ background: "red", color: "white", padding: 4 }}>Critical</span>
    </main>
  );
}
`;

export const CASES: readonly EvalCase[] = [
  {
    id: "switch-settings",
    prompt:
      "Add a ZoBlocks Switch to the settings page (src/app/settings/page.tsx) for contact precautions, replacing the checkbox.",
    fixture: "next-app",
    seed: { "src/app/settings/page.tsx": SETTINGS_PAGE },
    expect: ["switch"],
  },
  {
    id: "lab-result",
    prompt:
      "On the home page, show a potassium lab result of 6.8 mmol/L with a reference range of 3.5 to 5.1, using ZoBlocks.",
    fixture: "next-app",
    expect: ["result-value"],
  },
  {
    id: "convert-legacy",
    prompt:
      "Convert the loading spinner and the status badge on src/app/patient/page.tsx to ZoBlocks components.",
    fixture: "next-app",
    seed: { "src/app/patient/page.tsx": LEGACY_PAGE },
    expect: ["clinical-status"],
    expectOneOf: [
      "pulse-loader",
      "rhythm-loader",
      "breath-loader",
      "helix-loader",
      "infusion-loader",
    ],
  },
  {
    id: "login-form",
    prompt: "Create a login page using ZoBlocks.",
    fixture: "next-app",
    // ZoBlocks ships no inputs or buttons. The right answer invents none —
    // every grader still applies, and `imports are real` is the one that matters.
    expect: [],
  },
  {
    id: "antd-settings",
    prompt:
      "This app uses Ant Design. Add an encounter settings page with a ZoBlocks Switch for contact precautions and an Ant Design Save button, themed to match the app.",
    fixture: "next-app-antd",
    expect: ["switch"],
    mustContain: [
      { pattern: /AntdBridge/, why: "the bridge, so the Switch takes the antd theme" },
      { pattern: /from ["']antd["']/, why: "the Save button from Ant Design" },
    ],
  },
];
