"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import type { FontFace } from "@oxygenui-design/theme";
import { removeFontAction, uploadFontAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { cn } from "@/lib/utils";
import {
  Callout,
  DataTable,
  Field,
  Input,
  Panel,
  StatusChip,
  SubmitButton,
  type Column,
} from "@/components/ui";

/**
 * Uploading a face, and seeing what it does to a column of numbers.
 *
 * The validator behind this — magic-number identification, the size cap, the
 * digest, the tabular-figure check — has existed and been tested since the
 * theme package was written, and until now nothing could reach it. That is the
 * whole of this task: `checkFont` was built, correct, and unreachable.
 */
export function TypographyEditor({
  themeId,
  fonts,
  maxBytes,
  canWrite,
  reason,
}: {
  themeId: string;
  fonts: readonly FontFace[];
  maxBytes: number;
  canWrite: boolean;
  reason?: string;
}) {
  const [family, setFamily] = useState("");

  const columns: readonly Column<FontFace>[] = [
    {
      key: "family",
      header: "Family",
      cell: (face) => <span className="font-medium">{face.family}</span>,
    },
    { key: "weight", header: "Weight", cell: (face) => face.weight },
    {
      key: "figures",
      header: "Tabular figures",
      cell: (face) =>
        face.tabularNumerals === true ? (
          <StatusChip tone="pass">present</StatusChip>
        ) : face.tabularNumerals === false ? (
          <StatusChip tone="warn">absent</StatusChip>
        ) : (
          <StatusChip tone="neutral">unread</StatusChip>
        ),
    },
    {
      key: "sha",
      header: "Digest",
      cell: (face) => (
        <code className="tabular font-mono text-[0.6875rem] text-graphite" title={face.sha256}>
          {face.sha256?.slice(0, 12) ?? "—"}
        </code>
      ),
    },
    {
      key: "remove",
      header: "",
      width: "6rem",
      cell: (face) => (
        <ActionForm action={removeFontAction}>
          <input type="hidden" name="themeId" value={themeId} />
          <input type="hidden" name="family" value={face.family} />
          <SubmitButton variant="ghost" reason={reason} pendingLabel="Removing…" size="icon">
            <Trash2 aria-hidden="true" className="size-3.5" />
            <span className="sr-only">Remove {face.family}</span>
          </SubmitButton>
        </ActionForm>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-3 font-display text-[0.9375rem] font-semibold tracking-[-0.008em]">
          Uploaded faces
        </h2>
        <DataTable
          caption="Fonts uploaded for this theme"
          columns={columns}
          rows={fonts}
          rowKey={(face) => face.family}
          empty={
            <p className="surface px-5 py-6 text-center text-[0.8125rem] text-graphite">
              No uploaded faces. The theme uses whatever{" "}
              <code className="font-mono text-[0.75rem]">--ox-font-sans</code> resolves to — set
              that on the token editor to point at a face you already host.
            </p>
          }
        />
      </section>

      <Panel
        title="Upload a face"
        description={`woff2, woff, OpenType or TrueType, up to ${Math.round(maxBytes / 1024 / 1024)} MB. Identified by its first four bytes rather than its extension, so a file renamed to .woff2 is refused.`}
      >
        <ActionForm
          action={uploadFontAction}
          className="space-y-4"
          footer={
            <SubmitButton reason={reason} pendingLabel="Checking…" className="mt-4">
              <Upload aria-hidden="true" className="size-3.5" />
              Upload and check
            </SubmitButton>
          }
        >
          <input type="hidden" name="themeId" value={themeId} />

          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <Field
              label="Family name"
              required
              hint="What you will refer to it by. Taken from you rather than from inside the file — a name embedded in a font is not something to trust into a CSS declaration."
            >
              {(props) => (
                <Input
                  {...props}
                  name="family"
                  value={family}
                  onChange={(event) => setFamily(event.target.value)}
                  maxLength={64}
                  placeholder="Northwind Sans"
                  disabled={!canWrite}
                />
              )}
            </Field>

            <Field label="Weight" hint="400, or a range.">
              {(props) => (
                <Input {...props} name="weight" defaultValue="400" mono disabled={!canWrite} />
              )}
            </Field>
          </div>

          <Field label="File" required>
            {(props) => (
              <input
                {...props}
                type="file"
                name="file"
                accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                disabled={!canWrite}
                className={cn(
                  "block w-full text-[0.8125rem] text-graphite",
                  // The `file:` pseudo-element is the only part of this control
                  // a stylesheet can reach, so the button is styled and the
                  // field around it is left to the platform — a custom picker
                  // would need JavaScript and would lose the native file dialog.
                  "file:mr-3 file:rounded-lg file:border file:border-rule-strong file:bg-paper",
                  "file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-ink",
                  "file:cursor-pointer hover:file:bg-paper-sunk",
                  // Disabled was missed: the control greyed out and its button
                  // kept offering a hover state it would not honour.
                  "disabled:cursor-not-allowed disabled:text-graphite-soft",
                  "disabled:file:cursor-not-allowed disabled:file:border-rule",
                  "disabled:file:bg-paper-sunk disabled:file:text-graphite-soft",
                  "disabled:hover:file:bg-paper-sunk",
                )}
              />
            )}
          </Field>
        </ActionForm>
      </Panel>

      <Callout tone="info" title="What is checked, and what is recorded">
        The first four bytes decide the format. The size is capped before anything is parsed. A
        SHA-256 of exactly the accepted bytes becomes the serving URL, so what is served can be
        checked against what was approved by somebody who was not there. And the face is inspected
        for tabular figures — without them every numeric column renders ragged, which is invisible
        in a heading and obvious in a vitals table.
      </Callout>
    </div>
  );
}
