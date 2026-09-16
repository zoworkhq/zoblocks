"use client";

/**
 * Chrome shared by the Northwind screens.
 *
 * Same rule as `../kit`: application furniture so the library components have
 * somewhere to work, never a second component library. Styles live in
 * `app/blocks-northwind.css`, scoped under `.oxb`.
 */

import * as React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { CLINICIANS, faceOf, type ClinicianId, type Patient } from "./data";
import { Face } from "../kit";
import { useNav } from "./shell";

/* ------------------------------------------------------------ headings */

/** A screen's title row. `h2`: the page around the block owns the `h1`. */
export function ScreenHead({
  title,
  sub,
  actions,
  crumbs,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  crumbs?: React.ReactNode;
}) {
  return (
    <header className="scrHead">
      {crumbs ? <div className="scrCrumbs">{crumbs}</div> : null}
      <div className="scrRow">
        <div className="scrText">
          <h2>{title}</h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        {actions ? <div className="scrActions">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Padding and vertical rhythm for a screen's body. */
export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`scrBody${className ? ` ${className}` : ""}`}>{children}</div>;
}

/* ------------------------------------------------------------- controls */

export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="search">
      <SearchIcon aria-hidden="true" size={14} strokeWidth={1.7} />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.stopPropagation();
            onChange("");
          }
        }}
      />
      {value ? (
        <button
          type="button"
          className="searchClear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X aria-hidden="true" size={12} strokeWidth={2} />
        </button>
      ) : null}
    </label>
  );
}

/** A controlled segmented control. Counts, when given, are part of the label. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined ? <span className="segCount">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Filter chips: a wrapping row of toggles, for sets too long for a segmented control. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="chip"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined ? <span className="chipCount">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** A native select, dressed. */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <label className="select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
        <path
          d="M2 3.5l3 3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </label>
  );
}

/** Controlled tabs with real panels. `idBase` ties each tab to its panel. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  idBase,
  label,
}: {
  tabs: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  idBase: string;
  label: string;
}) {
  const list = React.useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.value === value);
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const t = tabs[next]!;
    onChange(t.value);
    list.current?.querySelector<HTMLElement>(`#${idBase}-tab-${t.value}`)?.focus();
  };
  return (
    <div className="tabbar" role="tablist" aria-label={label} ref={list} onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.value}
          id={`${idBase}-tab-${t.value}`}
          type="button"
          role="tab"
          aria-selected={t.value === value}
          aria-controls={`${idBase}-panel`}
          tabIndex={t.value === value ? 0 : -1}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count !== undefined ? <span className="tabCount">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({
  idBase,
  value,
  children,
}: {
  idBase: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={`${idBase}-panel`}
      role="tabpanel"
      aria-labelledby={`${idBase}-tab-${value}`}
      className="tabPanel"
    >
      {children}
    </div>
  );
}

export function Pager({
  page,
  pages,
  onPage,
  total,
  size,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
  total: number;
  size: number;
}) {
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  return (
    <div className="pager">
      <span className="pagerInfo">
        {from}–{to} of {total}
      </span>
      <div className="pagerBtns">
        <button
          type="button"
          className="btn ghost sm"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn ghost sm"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- people */

/** A patient's face and name, as a link into the record. */
export function PatientLink({
  p,
  size = 20,
  sub,
}: {
  p: Patient;
  size?: number;
  sub?: React.ReactNode;
}) {
  const { go } = useNav();
  return (
    <button
      type="button"
      className="ptLink"
      onClick={() => go({ screen: "record", patient: p.id })}
    >
      <Face name={p.name} src={faceOf(p.name)} size={size} />
      <span className="ptLinkText">
        <span className="ptLinkName">{p.name}</span>
        {sub ? <span className="ptLinkSub">{sub}</span> : null}
      </span>
    </button>
  );
}

export function ClinicianAvatar({ id, size = 24 }: { id: ClinicianId; size?: number }) {
  const c = CLINICIANS[id];
  return (
    <span
      className="tAv"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        borderRadius: Math.round(size * 0.32),
      }}
    >
      {c.initials}
    </span>
  );
}

/* ---------------------------------------------------------------- sheet */

/**
 * A side sheet on the native `<dialog>`.
 *
 * The top layer is the point: it sits above the gallery's own overlay and the
 * site header without a z-index contest, traps focus, and closes on Escape.
 * It stays a DOM child of `.oxb`, so the block's tokens still reach it.
 */
export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className="sheetInner">
          <div className="sheetHead">
            <div style={{ minWidth: 0 }}>
              <h3 id={titleId}>{title}</h3>
              {sub ? <p>{sub}</p> : null}
            </div>
            <button type="button" className="iconBtn" onClick={onClose} aria-label="Close">
              <X aria-hidden="true" size={15} strokeWidth={1.8} />
            </button>
          </div>
          <div className="sheetBody">{children}</div>
          {footer ? <div className="sheetFoot">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** A label and value pair inside a sheet or card. */
export function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="kv">
      <span className="kvK">{k}</span>
      <span className="kvV">{children}</span>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="ic" aria-hidden="true">
        ∅
      </div>
      <b className="emptyTitle">{title}</b>
      {children ? <div className="emptyText">{children}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}

/** A tiny sparkline of a score series on its instrument's own range. */
export function Spark({
  points,
  max,
  sev,
  width = 64,
  height = 20,
}: {
  points: readonly number[];
  max: number;
  sev: string;
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return <span className="sparkNone">—</span>;
  const pad = 2;
  const pts = points
    .map((v, i) => {
      const x = pad + (i * (width - pad * 2)) / (points.length - 1);
      const y = pad + (1 - v / max) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = points[points.length - 1]!;
  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={`var(--${sev})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width - pad}
        cy={pad + (1 - last / max) * (height - pad * 2)}
        r="2"
        fill={`var(--${sev})`}
      />
    </svg>
  );
}
