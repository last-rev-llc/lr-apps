export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCSVFile(text: string): ParsedCSV {
  const cleaned = text.startsWith("﻿") ? text.slice(1) : text;

  const allRows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      allRows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (ch === "\r") {
      // Treat lone CR or CRLF the same as LF outside quotes.
      row.push(field);
      allRows.push(row);
      row = [];
      field = "";
      if (cleaned[i + 1] === "\n") i++;
      continue;
    }
    field += ch;
  }

  // Flush trailing field/row if input didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    allRows.push(row);
  }

  // Drop fully-empty trailing rows that come from a single trailing newline.
  while (
    allRows.length > 0 &&
    allRows[allRows.length - 1]!.length === 1 &&
    allRows[allRows.length - 1]![0] === ""
  ) {
    allRows.pop();
  }

  if (allRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = allRows[0]!;
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < allRows.length; r++) {
    const cells = allRows[r]!;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]!] = cells[c] ?? "";
    }
    rows.push(obj);
  }

  return { headers, rows };
}

function escapeField(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatCSV(
  rows: Record<string, string>[],
  headers: string[],
): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeField).join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h] ?? "")).join(","));
  }
  return lines.join("\n") + "\n";
}

export interface QuestionSetItem {
  uid: string;
  question: string;
}

export function parseQuestionSetCSV(text: string): QuestionSetItem[] {
  const { headers, rows } = parseCSVFile(text);
  if (!headers.includes("Question")) {
    throw new Error('Missing required "Question" column');
  }
  const hasUid = headers.includes("UID");
  const items: QuestionSetItem[] = [];
  const seen = new Set<string>();
  let autoCounter = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNumber = i + 1;
    const question = (row.Question ?? "").trim();
    if (!question) {
      throw new Error(`Row ${rowNumber}: empty Question`);
    }

    let uid: string;
    if (hasUid && row.UID && row.UID.trim() !== "") {
      uid = row.UID.trim();
    } else {
      uid = `q${autoCounter++}`;
    }

    if (seen.has(uid)) {
      throw new Error(`Row ${rowNumber}: duplicate UID "${uid}"`);
    }
    seen.add(uid);

    items.push({ uid, question });
  }

  return items;
}

export interface EvalRunRow {
  question: string;
  uid: string;
  responseText: string;
  responseJSON: unknown;
  langfuseLink: string | null;
  tag: string | null;
}

export function formatEvalRunCSV(rows: EvalRunRow[]): string {
  const headers = [
    "Question",
    "UID",
    "ResponseText",
    "ResponseJSON",
    "LangfuseLink",
    "Tag",
  ];
  const mapped: Record<string, string>[] = rows.map((r) => ({
    Question: r.question,
    UID: r.uid,
    ResponseText: r.responseText,
    ResponseJSON: JSON.stringify(r.responseJSON ?? null),
    LangfuseLink: r.langfuseLink ?? "",
    Tag: r.tag ?? "",
  }));
  return formatCSV(mapped, headers);
}

export function formatCSVRunOutputCSV(
  headers: string[],
  rows: Record<string, string>[],
): string {
  const outHeaders = headers.includes("ResponseJSON")
    ? headers
    : [...headers, "ResponseJSON"];
  return formatCSV(rows, outHeaders);
}
