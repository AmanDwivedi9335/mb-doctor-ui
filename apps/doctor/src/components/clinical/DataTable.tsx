import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  className?: string;
  headClassName?: string;
}

const PAGE_SIZES = [5, 10, 25];

/** Thin wrapper over the table primitives: pass columns + rows, get a table with
 *  a built-in empty state. `paged` adds a "Show N entries" footer with a pager. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  empty = "Nothing to show.",
  paged = false,
  searchable,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  paged?: boolean;
  searchable?: (row: T) => string;
}) {
  const [query, setQuery] = useState("");
  const sourceRows = rows;
  rows = searchable ? rows.filter((row) => searchable(row).toLowerCase().includes(query.toLowerCase())) : rows;
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  // ponytail: clamp instead of a reset effect; a filter that shrinks the list just pulls the page back in range
  const cur = Math.min(page, pages);
  const visible = paged ? rows.slice((cur - 1) * size, cur * size) : rows;

  if (sourceRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  const start = Math.max(1, Math.min(cur - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);

  return (
    <div className="rounded-lg border bg-card">
      {searchable && <div className="pb-4"><Input className="h-9 max-w-[260px]" placeholder="Search" aria-label="Search appointment list" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} /></div>}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.headClassName}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && <TableRow><TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">No records match your search.</TableCell></TableRow>}
          {visible.map((row, i) => (
            <TableRow
              key={getRowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {columns.map((c) => (
                <TableCell key={c.key} className={c.className}>
                  {c.render(row, paged ? (cur - 1) * size + i : i)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {paged && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[13px] text-muted-foreground">
          <label className="flex items-center gap-2">
            Show
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-foreground"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            entries
          </label>
          <span className="tabular-nums">
            {rows.length ? (cur - 1) * size + 1 : 0}–{Math.min(cur * size, rows.length)} of {rows.length} entries
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" disabled={cur === 1} onClick={() => setPage(1)} aria-label="First page">
              <ChevronsLeft />
            </Button>
            <Button variant="outline" size="icon" className="size-8" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            {nums.map((n) => (
              <Button
                key={n}
                variant={n === cur ? "default" : "outline"}
                size="icon"
                className="size-8 tabular-nums"
                onClick={() => setPage(n)}
                aria-current={n === cur ? "page" : undefined}
              >
                {n}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="size-8" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page">
              <ChevronRight />
            </Button>
            <Button variant="outline" size="icon" className="size-8" disabled={cur === pages} onClick={() => setPage(pages)} aria-label="Last page">
              <ChevronsRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
