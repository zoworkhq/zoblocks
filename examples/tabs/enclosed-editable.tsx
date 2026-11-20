import { useState, type ReactNode } from "react";
import { Tabs } from "@zoblocks/tabs";

type DocumentTab = {
  value: string;
  label: string;
  icon?: ReactNode;
  dot?: "dirty";
  closable: boolean;
};

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6M10 3v7l-5.5 9.2A1.8 1.8 0 0 0 6 22h12a1.8 1.8 0 0 0 1.5-2.8L14 10V3" />
      <path d="M8 16h8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function Document({ id }: { id: string }) {
  const documents: Record<string, { title: string; description: string }> = {
    note: {
      title: "Progress note",
      description: "draft · unsaved changes",
    },
    cmp: {
      title: "CMP 2026-08-14",
      description: "saved",
    },
    ct: {
      title: "CT abdomen",
      description: "saved",
    },
  };

  const document = documents[id];

  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      {document ? (
        <p className="text-sm">
          <strong>{document.title}</strong> — {document.description}
        </p>
      ) : (
        <p className="text-sm">
          <strong>Untitled</strong> — New document ready to edit.
        </p>
      )}
    </div>
  );
}

export default function EnclosedAddCloseExample() {
  const [items, setItems] = useState<DocumentTab[]>([
    {
      value: "note",
      label: "Progress note",
      icon: <NoteIcon />,
      dot: "dirty",
      closable: true,
    },
    {
      value: "cmp",
      label: "CMP 2026-08-14",
      icon: <FlaskIcon />,
      closable: true,
    },
    {
      value: "ct",
      label: "CT abdomen",
      icon: <ImageIcon />,
      closable: true,
    },
  ]);

  const [value, setValue] = useState("note");

  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        variant="enclosed"
        aria-label="Open documents"
        value={value}
        onChange={setValue}
        items={items.map((item) => ({
          ...item,
          children: <Document id={item.value} />,
        }))}
        editable={{
          onClose: (target) => {
            const index = items.findIndex((item) => item.value === target);
            const rest = items.filter((item) => item.value !== target);

            setItems(rest);

            if (value === target) {
              const nextValue = rest[index]?.value ?? rest[rest.length - 1]?.value ?? "";

              setValue(nextValue);
            }
          },
          onAdd: () => {
            const next = `new-${Date.now()}`;

            setItems((current) => [
              ...current,
              {
                value: next,
                label: "Untitled",
                closable: true,
              },
            ]);

            setValue(next);
          },
        }}
      />
      <div className="rounded-xl border border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
        <p className="text-xs text-[var(--zb-text-muted)]">Close a tab, or press ＋.</p>
      </div>
    </section>
  );
}
