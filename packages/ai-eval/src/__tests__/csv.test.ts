import { describe, expect, it } from "vitest";
import {
  formatCSV,
  formatCSVRunOutputCSV,
  formatEvalRunCSV,
  parseCSVFile,
  parseQuestionSetCSV,
} from "../csv";

describe("parseCSVFile", () => {
  it("parses a simple CSV", () => {
    const { headers, rows } = parseCSVFile("a,b,c\n1,2,3\n4,5,6\n");
    expect(headers).toEqual(["a", "b", "c"]);
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const { rows } = parseCSVFile('a,b\n"x,y",z\n');
    expect(rows).toEqual([{ a: "x,y", b: "z" }]);
  });

  it("handles multi-line quoted fields", () => {
    const { rows } = parseCSVFile('Question,UID\n"line1\nline2",q1\n');
    expect(rows).toEqual([{ Question: "line1\nline2", UID: "q1" }]);
  });

  it("handles escaped double quotes", () => {
    const { rows } = parseCSVFile('a\n"He said ""hi"""\n');
    expect(rows).toEqual([{ a: 'He said "hi"' }]);
  });

  it("treats CRLF and LF identically", () => {
    const lf = parseCSVFile("a,b\n1,2\n3,4\n");
    const crlf = parseCSVFile("a,b\r\n1,2\r\n3,4\r\n");
    expect(crlf).toEqual(lf);
  });

  it("strips a leading BOM", () => {
    const withBom = parseCSVFile("﻿a,b\n1,2\n");
    const withoutBom = parseCSVFile("a,b\n1,2\n");
    expect(withBom).toEqual(withoutBom);
  });

  it("preserves CRLF inside quoted fields", () => {
    const { rows } = parseCSVFile('a,b\n"line1\r\nline2",x\n');
    expect(rows).toEqual([{ a: "line1\r\nline2", b: "x" }]);
  });

  it("flushes a trailing row without newline", () => {
    const { rows } = parseCSVFile("a,b\n1,2");
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("fills missing trailing fields with empty string", () => {
    const { rows } = parseCSVFile("a,b,c\n1,2\n");
    expect(rows).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});

describe("formatCSV", () => {
  it("wraps fields with commas", () => {
    const out = formatCSV([{ a: "x,y", b: "z" }], ["a", "b"]);
    expect(out).toBe('a,b\n"x,y",z\n');
  });

  it("wraps fields with newlines", () => {
    const out = formatCSV([{ a: "line1\nline2" }], ["a"]);
    expect(out).toBe('a\n"line1\nline2"\n');
  });

  it("wraps and doubles fields with quotes", () => {
    const out = formatCSV([{ a: 'He said "hi"' }], ["a"]);
    expect(out).toBe('a\n"He said ""hi"""\n');
  });

  it("wraps fields containing all special characters", () => {
    const out = formatCSV([{ a: 'a,b\n"c"' }], ["a"]);
    expect(out).toBe('a\n"a,b\n""c"""\n');
  });

  it("round-trips multi-line and quoted values", () => {
    const headers = ["Question", "UID"];
    const rows = [
      { Question: "line1\nline2", UID: "q1" },
      { Question: 'He said "hi"', UID: "q2" },
      { Question: "a,b,c", UID: "q3" },
    ];
    const re = parseCSVFile(formatCSV(rows, headers));
    expect(re.headers).toEqual(headers);
    expect(re.rows).toEqual(rows);
  });

  it("round-trips 50 randomized rows containing tricky chars", () => {
    const chars = ["a", ",", '"', "\n", "\r", "z"];
    const rows: Record<string, string>[] = [];
    for (let i = 0; i < 50; i++) {
      const a = Array.from({ length: 5 }, () =>
        chars[Math.floor(Math.random() * chars.length)],
      ).join("");
      const b = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)],
      ).join("");
      rows.push({ A: a, B: b });
    }
    const headers = ["A", "B"];
    const re = parseCSVFile(formatCSV(rows, headers));
    expect(re.rows).toEqual(rows);
  });
});

describe("parseQuestionSetCSV", () => {
  it("rejects missing Question column", () => {
    expect(() => parseQuestionSetCSV("Foo\nbar\n")).toThrow(/Question/);
  });

  it("rejects empty Question with the row number", () => {
    const csv = "Question,UID\nfirst,q1\nsecond,q2\n,q3\n";
    expect(() => parseQuestionSetCSV(csv)).toThrow(/Row 3/);
  });

  it("rejects duplicate UIDs with the row number", () => {
    const csv = "Question,UID\nfirst,q1\nsecond,q2\nthird,q3\nfourth,q1\n";
    expect(() => parseQuestionSetCSV(csv)).toThrow(/Row 4: duplicate UID "q1"/);
  });

  it("auto-generates UIDs when the UID column is absent", () => {
    const items = parseQuestionSetCSV("Question\nfirst\nsecond\nthird\n");
    expect(items).toEqual([
      { uid: "q1", question: "first" },
      { uid: "q2", question: "second" },
      { uid: "q3", question: "third" },
    ]);
  });

  it("uses explicit UIDs and auto-fills blank ones", () => {
    const csv = "Question,UID\nfirst,custom-a\nsecond,\nthird,custom-b\n";
    const items = parseQuestionSetCSV(csv);
    expect(items).toEqual([
      { uid: "custom-a", question: "first" },
      { uid: "q1", question: "second" },
      { uid: "custom-b", question: "third" },
    ]);
  });

  it("flags collisions between auto-generated and explicit UIDs", () => {
    const csv = "Question,UID\nfirst,\nsecond,q1\n";
    expect(() => parseQuestionSetCSV(csv)).toThrow(/duplicate UID "q1"/);
  });
});

describe("formatEvalRunCSV", () => {
  it("emits the expected columns", () => {
    const csv = formatEvalRunCSV([
      {
        question: "q1",
        uid: "u1",
        responseText: "answer",
        responseJSON: { foo: "bar" },
        langfuseLink: "https://lf.example/x",
        tag: "ok",
      },
    ]);
    const { headers, rows } = parseCSVFile(csv);
    expect(headers).toEqual([
      "Question",
      "UID",
      "ResponseText",
      "ResponseJSON",
      "LangfuseLink",
      "Tag",
    ]);
    expect(rows).toEqual([
      {
        Question: "q1",
        UID: "u1",
        ResponseText: "answer",
        ResponseJSON: '{"foo":"bar"}',
        LangfuseLink: "https://lf.example/x",
        Tag: "ok",
      },
    ]);
  });

  it("renders nullable cols as empty and JSON null for missing payloads", () => {
    const csv = formatEvalRunCSV([
      {
        question: "q",
        uid: "u",
        responseText: "",
        responseJSON: null,
        langfuseLink: null,
        tag: null,
      },
    ]);
    const { rows } = parseCSVFile(csv);
    expect(rows[0]).toEqual({
      Question: "q",
      UID: "u",
      ResponseText: "",
      ResponseJSON: "null",
      LangfuseLink: "",
      Tag: "",
    });
  });
});

describe("formatCSVRunOutputCSV", () => {
  it("appends ResponseJSON if absent", () => {
    const csv = formatCSVRunOutputCSV(
      ["a", "b"],
      [{ a: "1", b: "2", ResponseJSON: '{"x":1}' }],
    );
    const { headers, rows } = parseCSVFile(csv);
    expect(headers).toEqual(["a", "b", "ResponseJSON"]);
    expect(rows[0]).toEqual({ a: "1", b: "2", ResponseJSON: '{"x":1}' });
  });

  it("does not duplicate ResponseJSON when already present", () => {
    const csv = formatCSVRunOutputCSV(
      ["a", "ResponseJSON"],
      [{ a: "1", ResponseJSON: '{"x":1}' }],
    );
    const { headers } = parseCSVFile(csv);
    expect(headers).toEqual(["a", "ResponseJSON"]);
  });
});
