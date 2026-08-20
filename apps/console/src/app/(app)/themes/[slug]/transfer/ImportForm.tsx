"use client";

import { useState } from "react";
import { importThemeAction } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, Panel, SubmitButton, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Pasting a theme in.
 *
 * A textarea rather than a drop zone, deliberately: this is the accessible
 * route and the one that works from a terminal, an SSH session, or a clipboard.
 * Drag-and-drop is the enhancement to add on top of it, never the only way in.
 */
export function ImportForm({ themeId }: { themeId: string }) {
  const [payload, setPayload] = useState("");
  const [over, setOver] = useState(false);

  /*
   * Reading a dropped file into the textarea rather than posting it separately.
   *
   * The textarea stays the single source of what will be submitted, so a
   * customer can drop a file and then *edit* it before importing — which is
   * exactly what people do when a file has one key they do not want. A
   * drop handler that bypassed the field would take that away.
   */
  const read = async (file: File | undefined) => {
    if (!file) return;
    setPayload(await file.text());
  };

  return (
    <Panel
      title="Paste a theme file"
      description="A DTCG file, a Tokens Studio or Figma Variables export, or an existing antd or MUI theme object. Nothing is saved until you have seen what it would change."
    >
      <ActionForm
        action={importThemeAction}
        footer={
          <SubmitButton pendingLabel="Reading…" className="mt-4">
            Preview import
          </SubmitButton>
        }
      >
        <input type="hidden" name="themeId" value={themeId} />

        <Field
          label="File contents"
          required
          hint="Clinical status and identity flags are always discarded. They carry a validated contrast floor and 60° of hue separation that a file from another system cannot preserve."
        >
          {(props) => (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setOver(false);
                void read(event.dataTransfer.files[0]);
              }}
              className={cn(
                "rounded-lg border border-dashed transition-colors duration-200",
                over ? "border-oxygen bg-accent-wash" : "border-transparent",
              )}
            >
              <Textarea
                {...props}
                mono
                name="payload"
                rows={8}
                spellCheck={false}
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                placeholder={
                  'Paste, or drop a file here.\n\n{ "ref": { "brand": { "600": { "$value": "#1d63c9" } } } }'
                }
              />
            </div>
          )}
        </Field>
      </ActionForm>
    </Panel>
  );
}
