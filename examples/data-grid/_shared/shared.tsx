import * as React from "react";
import { DataGrid, type DataGridColumn, type DataGridProps } from "@/components/zoblocks/data-grid";
import { isGridAbsent, type GridCoverage } from "@/lib/zoblocks-grid";
import { CASELOAD, type CaseloadRow } from "./caseload";

export { ABSENCE_CASELOAD, CASELOAD, type CaseloadRow } from "./caseload";

export const CAPTION =
  "Clients on this team's caseload with a raised PHQ-9 or a recent risk screen";
export const TITLE = "Caseload · adult outpatient";
export const CASELOAD_COVERAGE: GridCoverage = {
  shown: CASELOAD.length,
  total: 312,
  noun: "clients on this team's caseload",
  predicate: "PHQ-9 of 10 or more, or a risk screen in the last 14 days.",
};

const DISENGAGEMENT = {
  model: "disengagement",
  version: "v1.8",
  validatedOn: "9,140 outpatient episodes",
  population: "adults, English-language intake only",
};

function initials(name: string) {
  return (name.split(",")[0] ?? name)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function riskScreenStyle(value: string) {
  if (value === "Ideation with plan") {
    return {
      color: "var(--zb-status-critical)",
      background: "var(--zb-status-critical-bg)",
      border: "1px solid var(--zb-status-critical-border)",
    };
  }
  if (value === "Ideation, no plan") {
    return {
      color: "var(--zb-swatch-1)",
      background: "var(--zb-swatch-1-bg)",
      border: "1px solid var(--zb-swatch-1-border)",
    };
  }
  if (value === "Passive ideation") {
    return {
      color: "var(--zb-swatch-2)",
      background: "var(--zb-swatch-2-bg)",
      border: "1px solid var(--zb-swatch-2-border)",
    };
  }
  return {
    color: "var(--zb-text-muted)",
    background: "var(--zb-bg-muted)",
    border: "1px solid var(--zb-border)",
  };
}

export const CASELOAD_COLUMNS: DataGridColumn<CaseloadRow>[] = [
  {
    key: "name",
    header: "Client",
    kind: "text",
    value: (row) => row.name,
    cell: (row) => (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}>
        <span
          aria-hidden="true"
          style={{
            display: "inline-grid",
            placeItems: "center",
            inlineSize: "2.25rem",
            blockSize: "2.25rem",
            flex: "0 0 auto",
            borderRadius: "var(--zb-radius-full)",
            background: "var(--zb-accent-subtle)",
            border: "1px solid var(--zb-accent-border)",
            color: "var(--zb-accent)",
            fontFamily: "var(--zb-font-mono)",
            fontSize: "var(--zb-text-2xs)",
            fontWeight: 700,
          }}
        >
          {initials(row.name)}
        </span>
        <span style={{ display: "grid", gap: "0.05rem", minInlineSize: 0 }}>
          <strong style={{ color: "var(--zb-text)", fontWeight: 600 }}>{row.name}</strong>
          <span
            style={{
              color: "var(--zb-text-muted)",
              fontFamily: "var(--zb-font-mono)",
              fontSize: "var(--zb-text-2xs)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.mrn}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    value: (row) => row.phq9,
    cell: (row) => {
      if (isGridAbsent(row.phq9)) return <span>{row.phq9.absent}</span>;
      if (typeof row.phq9 !== "number") return null;
      const change = row.previousPhq9 === undefined ? null : row.phq9 - row.previousPhq9;
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          <strong
            style={{
              fontSize: "var(--zb-text-md)",
              fontWeight: 700,
              color: "var(--zb-text)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {row.phq9}
          </strong>
          {change !== null && change !== 0 ? (
            <span
              aria-label={`${Math.abs(change)} point ${change > 0 ? "increase" : "decrease"}`}
              style={{
                color: change > 0 ? "var(--zb-status-critical)" : "var(--zb-text-muted)",
                fontFamily: "var(--zb-font-mono)",
                fontSize: "var(--zb-text-xs)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {change > 0 ? "▲" : "▼"} {Math.abs(change)}
            </span>
          ) : null}
        </span>
      );
    },
  },
  {
    key: "cssrs",
    header: "Risk screen",
    kind: "status",
    value: (row) => row.cssrs,
    cell: (row) => {
      if (isGridAbsent(row.cssrs)) return <span>{row.cssrs.absent}</span>;
      if (typeof row.cssrs !== "string") return null;
      const style = riskScreenStyle(row.cssrs);
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minBlockSize: "1.625rem",
            paddingInline: "0.55rem",
            borderRadius: "var(--zb-radius-sm)",
            ...style,
            fontSize: "var(--zb-text-xs)",
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {row.cssrs}
        </span>
      );
    },
  },
  {
    key: "risk",
    header: "Disengagement",
    kind: "number",
    value: (row) => row.risk,
    derived: DISENGAGEMENT,
    cell: (row) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.6rem",
          inlineSize: "100%",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            inlineSize: "3.5rem",
            blockSize: "0.3rem",
            overflow: "hidden",
            borderRadius: "var(--zb-radius-full)",
            background: "var(--zb-bg-muted)",
          }}
        >
          <span
            style={{
              display: "block",
              inlineSize: `${Math.round(row.risk * 100)}%`,
              blockSize: "100%",
              borderRadius: "inherit",
              background: "var(--zb-accent)",
            }}
          />
        </span>
        <span
          style={{
            minInlineSize: "2.25rem",
            fontFamily: "var(--zb-font-mono)",
            fontVariantNumeric: "tabular-nums",
            textAlign: "end",
          }}
        >
          {row.risk.toFixed(2)}
        </span>
      </span>
    ),
  },
  {
    key: "due",
    header: "Next contact",
    kind: "instant",
    value: (row) => row.due,
    cell: (row) => {
      const urgent = row.due.startsWith("Today");
      return (
        <span
          style={{
            color: urgent ? "var(--zb-status-critical)" : "var(--zb-text)",
            fontWeight: urgent ? 700 : 500,
            whiteSpace: "nowrap",
          }}
        >
          {row.due}
        </span>
      );
    },
  },
];

const WIDE_WIDTHS: Record<string, string> = {
  name: "16rem",
  phq9: "10rem",
  cssrs: "17rem",
  risk: "14rem",
  due: "12rem",
};

export const WIDE_COLUMNS = CASELOAD_COLUMNS.map((column) => ({
  ...column,
  width: WIDE_WIDTHS[column.key],
}));

type RequiredGridProps = "caption" | "title" | "columns" | "rows" | "rowKey" | "coverage";

export interface DemoGridProps extends Omit<DataGridProps<CaseloadRow>, RequiredGridProps> {
  rows?: readonly CaseloadRow[];
  coverage?: GridCoverage;
  columns?: readonly DataGridColumn<CaseloadRow>[];
  title?: React.ReactNode;
}

export function DemoGrid({
  rows = CASELOAD,
  coverage = CASELOAD_COVERAGE,
  columns = CASELOAD_COLUMNS,
  title = TITLE,
  ...props
}: DemoGridProps) {
  return (
    <DataGrid<CaseloadRow>
      caption={CAPTION}
      title={title}
      note="14-day window"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.mrn}
      coverage={coverage}
      density="comfortable"
      {...props}
    />
  );
}

/** Lays an example out. The page around it supplies the frame and the title. */
export function Example({ children }: { children: React.ReactNode }) {
  return <section className="grid min-w-0 gap-3">{children}</section>;
}

export function HostStatus({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="m-0 text-xs" style={{ color: "var(--zb-text-muted, #64748b)" }}>
      {children}
    </p>
  );
}
