import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./control";

/**
 * Search and sort for a `DataTable`, held in the URL.
 *
 * Both are plain links and a plain `GET` form, not client state. That is the
 * whole design decision here and it buys three things a `useState` filter does
 * not: a filtered list is a URL somebody can send to a colleague, the back
 * button walks the searches they tried, and the table keeps working with no
 * JavaScript at all — the form submits, the server filters, the page renders.
 *
 * It also keeps `DataTable` a server component. Filtering on the client would
 * mean shipping every row to the browser and making the whole table a client
 * component, which on the themes list means shipping every customer's draft
 * token set to render five names.
 */

/** Reads the loose `searchParams` shape a page receives into something typed. */
export interface TableQuery {
  q: string;
  sort: string;
  dir: "asc" | "desc";
}

export function tableQuery(
  params: Record<string, string | string[] | undefined>,
  fallback: { sort: string; dir?: "asc" | "desc" },
): TableQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    q: (one("q") ?? "").trim(),
    sort: one("sort") ?? fallback.sort,
    dir: one("dir") === "asc" ? "asc" : one("dir") === "desc" ? "desc" : (fallback.dir ?? "desc"),
  };
}

/**
 * A search box that submits to the current route.
 *
 * `defaultValue` rather than `value`: this is an uncontrolled form field whose
 * state is the URL, and the round trip is what updates it.
 */
export function TableSearch({
  action,
  query,
  placeholder,
  total,
  showing,
  noun = "theme",
}: {
  /** The route to submit to — the same page the table is on. */
  action: string;
  query: TableQuery;
  placeholder: string;
  total: number;
  showing: number;
  /**
   * What is being counted, singular. Pluralised by adding an "s".
   *
   * This said "theme" as a literal, because the component was written for one
   * screen. The second caller is what turns that from a shortcut into a bug —
   * "3 themes" over a list of members is the component telling the reader
   * something false about their own data.
   */
  noun?: string;
}) {
  const filtered = query.q.length > 0;

  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      role="search"
    >
      {/* The sort survives a search. Without these the first search would
          silently reset a column the reader had just chosen to order by. */}
      <input type="hidden" name="sort" value={query.sort} />
      <input type="hidden" name="dir" value={query.dir} />

      <div className="relative min-w-0 flex-1 basis-[16rem]">
        <Search
          aria-hidden="true"
          strokeWidth={2}
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-graphite-soft"
        />
        <label htmlFor="table-search" className="sr-only">
          {placeholder}
        </label>
        <input
          id="table-search"
          type="search"
          name="q"
          defaultValue={query.q}
          placeholder={placeholder}
          className={controlClasses({ size: "sm", className: "pl-8" })}
        />
      </div>

      <p aria-live="polite" className="tabular shrink-0 text-[0.75rem] text-graphite">
        {filtered ? (
          <>
            {showing} of {total}
            {showing === 0 && " — nothing matches"}
          </>
        ) : (
          `${total} ${total === 1 ? noun : `${noun}s`}`
        )}
      </p>
    </form>
  );
}

/**
 * A sortable column header.
 *
 * Rendered as the `header` of a `Column`, with that column's `sorted` set so
 * `aria-sort` stays honest — the arrow is decoration and `aria-sort` is what a
 * screen reader announces.
 */
export function SortHeader({
  label,
  column,
  query,
  action,
  numeric,
}: {
  label: string;
  column: string;
  query: TableQuery;
  action: string;
  numeric?: boolean;
}) {
  const active = query.sort === column;
  // Clicking the active column flips it; clicking a new one starts descending,
  // which is what somebody sorting by a date or a version wants first.
  const next = active && query.dir === "desc" ? "asc" : "desc";
  const params = new URLSearchParams({ sort: column, dir: next });
  if (query.q) params.set("q", query.q);

  const Icon = !active ? ArrowUpDown : query.dir === "desc" ? ArrowDown : ArrowUp;

  return (
    <Link
      href={`${action}?${params}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded transition-colors duration-150 hover:text-ink",
        active && "text-ink",
        numeric && "flex-row-reverse",
      )}
    >
      {label}
      <Icon
        aria-hidden="true"
        strokeWidth={2.5}
        className={cn("size-3 shrink-0", active ? "text-brand-deep" : "text-graphite-soft/60")}
      />
    </Link>
  );
}
