import { cn } from "@/lib/utils";

/**
 * A real table.
 *
 * Not a grid of `<div>`s. A screen reader announces "column 2 of 5, Version" in
 * a table and announces nothing at all in a flexbox — and every list in this
 * console is genuinely tabular data a person compares down a column, which is
 * the case tables exist for.
 *
 * The caption is required rather than optional. A page with two tables gives a
 * screen-reader user two unnamed tables otherwise, and there is no recovering
 * from that by reading harder.
 */
export interface Column<Row> {
  key: string;
  header: React.ReactNode;
  /** Right-aligns and applies tabular numerals. For anything compared down a column. */
  numeric?: boolean;
  width?: string;
  cell: (row: Row) => React.ReactNode;
  /** Set when this column is currently sorted, so `aria-sort` is honest. */
  sorted?: "ascending" | "descending";
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  empty,
  className,
}: {
  /** Names the table. Visually hidden, never absent. */
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  empty?: React.ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    /*
     * `relative` is load-bearing, not decoration.
     *
     * The caption is `sr-only`, which positions it absolutely. Without a
     * positioned ancestor its containing block is the initial one — the
     * document — so its static position inside a table that is itself 550px
     * wide extends the *page* scroll width even though the table is clipped
     * here. At 320px that produced 143px of horizontal page scroll on the
     * members screen: a WCAG 1.4.10 failure caused entirely by a visually
     * hidden element nobody can see.
     *
     * Making this the containing block keeps the caption inside the scroller
     * with the table it names.
     */
    /*
     * Wide content scrolls inside its own container so the page never scrolls
     * sideways — a horizontal page scroll on a narrow screen loses the rail.
     *
     * `scroll-x` puts a shadow on whichever edge still has columns behind it.
     * Without it a table clipped at a hard border looks like a table that ends
     * there, and on a phone the Status column of every list in this console is
     * off-screen with nothing to say so.
     */
    <div className={cn("surface scroll-x relative overflow-x-auto", className)}>
      <table className="w-full border-collapse text-[0.8125rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={column.sorted}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "whitespace-nowrap border-b border-rule bg-paper-sunk px-4 py-2.5",
                  "font-mono text-[0.625rem] font-medium uppercase tracking-[0.11em] text-graphite-soft",
                  column.numeric ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-rule last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-2.5 align-middle", column.numeric && "tabular text-right")}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
