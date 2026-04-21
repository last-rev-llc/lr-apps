import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../components/table";

describe("Table", () => {
  it("renders a basic table", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("forwards refs on all sub-components", () => {
    const tableRef = createRef<HTMLTableElement>();
    const headRef = createRef<HTMLTableCellElement>();
    const cellRef = createRef<HTMLTableCellElement>();
    const captionRef = createRef<HTMLTableCaptionElement>();

    render(
      <Table ref={tableRef}>
        <TableCaption ref={captionRef}>Caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead ref={headRef}>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell ref={cellRef}>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(tableRef.current).toBeInstanceOf(HTMLTableElement);
    expect(headRef.current).toBeInstanceOf(HTMLTableCellElement);
    expect(cellRef.current).toBeInstanceOf(HTMLTableCellElement);
    expect(captionRef.current).toBeInstanceOf(HTMLTableCaptionElement);
  });

  it("applies custom className", () => {
    render(
      <Table data-testid="table" className="custom-class">
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByTestId("table")).toHaveClass("custom-class");
  });

  it("renders sort indicator on TableHead", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sorted="asc">Name</TableHead>
            <TableHead sorted="desc">Age</TableHead>
            <TableHead sorted={false}>Email</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText("↓")).toBeInTheDocument();
  });

  it("calls onSort when TableHead is clicked", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onSort={onSort}>Name</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    await user.click(screen.getByText("Name"));
    expect(onSort).toHaveBeenCalledOnce();
  });

  it("renders TableFooter", () => {
    render(
      <Table>
        <TableFooter data-testid="footer">
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});
