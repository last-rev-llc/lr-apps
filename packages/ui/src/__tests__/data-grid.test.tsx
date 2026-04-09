import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid, type DataGridColumn } from "../components/data-grid";

interface TestRow {
  id: string;
  name: string;
  age: number;
  [key: string]: unknown;
}

const columns: DataGridColumn<TestRow>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "age", header: "Age", sortable: true },
];

const data: TestRow[] = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
  { id: "3", name: "Charlie", age: 35 },
];

describe("DataGrid", () => {
  it("renders tabular data", () => {
    render(<DataGrid columns={columns} data={data} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows empty state when data is empty", () => {
    render(
      <DataGrid
        columns={columns}
        data={[]}
        emptyTitle="Nothing here"
        emptyDescription="Add some data"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add some data")).toBeInTheDocument();
  });

  it("sorts data when clicking a sortable column header", async () => {
    const user = userEvent.setup();
    render(<DataGrid columns={columns} data={data} />);

    // Click Name header to sort ascending
    await user.click(screen.getByText("Name"));
    const rows = screen.getAllByRole("row");
    // Row 0 is header, rows 1-3 are data
    expect(within(rows[1]).getByText("Alice")).toBeInTheDocument();

    // Click again to sort descending
    await user.click(screen.getByText("Name"));
    const rowsDesc = screen.getAllByRole("row");
    expect(within(rowsDesc[1]).getByText("Charlie")).toBeInTheDocument();
  });

  it("supports row selection", async () => {
    const user = userEvent.setup();
    const onSelectRows = vi.fn();
    render(
      <DataGrid columns={columns} data={data} selectable onSelectRows={onSelectRows} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "select all", rest are row checkboxes
    expect(checkboxes).toHaveLength(4);

    // Select first row
    await user.click(checkboxes[1]);
    expect(onSelectRows).toHaveBeenCalledWith(["1"]);
  });

  it("select all toggles all rows", async () => {
    const user = userEvent.setup();
    const onSelectRows = vi.fn();
    render(
      <DataGrid columns={columns} data={data} selectable onSelectRows={onSelectRows} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // select all
    expect(onSelectRows).toHaveBeenCalledWith(expect.arrayContaining(["1", "2", "3"]));
  });

  it("supports custom cell render", () => {
    const columnsWithRender: DataGridColumn<TestRow>[] = [
      { key: "name", header: "Name", render: (val) => <strong>{String(val)}</strong> },
    ];
    render(<DataGrid columns={columnsWithRender} data={data} />);
    const strong = screen.getByText("Alice");
    expect(strong.tagName).toBe("STRONG");
  });
});
