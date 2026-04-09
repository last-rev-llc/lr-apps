"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table";
import { EmptyState } from "./empty-state";

export interface DataGridColumn<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataGridProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: DataGridColumn<T>[];
  data: T[];
  keyField?: string;
  sortable?: boolean;
  selectable?: boolean;
  onSelectRows?: (selectedKeys: string[]) => void;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

function DataGridInner<T extends Record<string, unknown>>(
  {
    columns,
    data,
    keyField = "id",
    sortable = false,
    selectable = false,
    onSelectRows,
    emptyIcon,
    emptyTitle = "No data",
    emptyDescription,
    emptyAction,
    className,
    ...props
  }: DataGridProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [data, sort]);

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onSelectRows?.(Array.from(next));
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
      onSelectRows?.([]);
    } else {
      const all = new Set(data.map((row) => String(row[keyField])));
      setSelected(all);
      onSelectRows?.(Array.from(all));
    }
  };

  if (data.length === 0) {
    return (
      <div ref={ref} className={className} {...props}>
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  role="checkbox"
                  checked={selected.size === data.length}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const isSortable = col.sortable ?? sortable;
              return (
                <TableHead
                  key={col.key}
                  sorted={sort?.key === col.key ? sort.direction : false}
                  onSort={isSortable ? () => handleSort(col.key) : undefined}
                  className={col.className}
                >
                  {col.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => {
            const rowKey = String(row[keyField]);
            return (
              <TableRow
                key={rowKey}
                data-state={selected.has(rowKey) ? "selected" : undefined}
              >
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      role="checkbox"
                      checked={selected.has(rowKey)}
                      onChange={() => toggleRow(rowKey)}
                      aria-label={`Select row ${rowKey}`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export const DataGrid = React.forwardRef(DataGridInner) as <T extends Record<string, unknown>>(
  props: DataGridProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;
