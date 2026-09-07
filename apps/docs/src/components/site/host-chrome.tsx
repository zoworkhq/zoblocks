"use client";

/**
 * The chrome an application puts around a clinical component.
 *
 * ZoBlocks ships 28 components and none of them is a Button — ADR 0010 keeps
 * primitives at Ant Design's API and free of any dependency on it. So the
 * honest way to show a reader what ZoBlocks looks like inside their stack is to
 * render their framework's real controls next to ours, rather than to pretend
 * we have a Button and restyle it.
 *
 * Everything below comes from `useHost()`, so this file is written once and
 * renders three ways: Ant Design's own components under the antd host,
 * `@mui/material`'s under the MUI host — with MUI's ripple, because the
 * adapter never sets `disableRipple` and a Material button without one is not
 * what MUI ships — and ZoBlocks's reference chrome by default.
 *
 * State is local and deliberately trivial. This is a demonstration of what the
 * controls look like and how they respond, not a form.
 */

import * as React from "react";
import { useHost } from "@zoblocks/host-react";

const WARDS = [
  { value: "acute", label: "Acute medical unit" },
  { value: "ward7", label: "Ward 7 — respiratory" },
  { value: "itu", label: "Intensive care" },
];

const SECTIONS = [
  { key: "results", label: "Results" },
  { key: "trend", label: "Trend" },
  { key: "orders", label: "Orders" },
];

export function HostChrome() {
  const { id, Button, Input, Switch, Checkbox, Select, Tabs } = useHost();
  const [precautions, setPrecautions] = React.useState(true);
  const [acknowledged, setAcknowledged] = React.useState(false);

  return (
    <div className="flex flex-col gap-4" data-zb-host-chrome={id}>
      <Tabs items={SECTIONS} defaultActiveKey="results" aria-label="Chart sections" />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="primary" onClick={() => setAcknowledged(true)}>
          {acknowledged ? "Acknowledged" : "Acknowledge result"}
        </Button>
        <Button type="default">Order repeat</Button>
        <Button type="text">Dismiss</Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input label="Note" placeholder="Add a note…" aria-label="Note" />
        <Select label="Ward" defaultValue="acute" options={WARDS} aria-label="Ward" />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2">
          <Switch
            checked={precautions}
            onChange={setPrecautions}
            aria-label="Contact precautions"
          />
          Contact precautions
        </span>
        <Checkbox defaultChecked>Seen by the responsible clinician</Checkbox>
      </div>
    </div>
  );
}
