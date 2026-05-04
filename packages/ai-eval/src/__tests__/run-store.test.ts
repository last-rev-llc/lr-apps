// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

interface RunRow {
  id: string;
  user_id: string;
  target_id: string;
  mode: "eval" | "csv";
  status: "queued" | "running" | "completed" | "cancelled" | "errored";
  question_set_id: string | null;
  upload_storage_path: string | null;
  prompt_template: string | null;
  tag: string | null;
  concurrency: number;
  total_rows: number;
  completed_rows: number;
  errored_rows: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface RunRowRow {
  id: string;
  run_id: string;
  uid: string;
  position: number;
  prompt: string;
  meta: Record<string, unknown> | null;
  status: "queued" | "running" | "completed" | "errored" | "cancelled";
  response_text: string | null;
  response_json: Record<string, unknown> | null;
  langfuse_link: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

class FakeSupabase {
  runs: RunRow[] = [];
  rows: RunRowRow[] = [];

  async rpc(name: string, args: Record<string, unknown>) {
    if (name === "create_chatflow_run") {
      const inputs = args.p_inputs as Array<{
        uid: string;
        position: number;
        prompt: string;
        meta?: Record<string, unknown> | null;
      }>;
      // simulate transactional check: every input must have a non-empty uid
      if (!Array.isArray(inputs) || inputs.length === 0) {
        return { data: null, error: { message: "no inputs" } };
      }
      for (const i of inputs) {
        if (!i.uid) {
          return { data: null, error: { message: "missing uid" } };
        }
      }
      const runId = crypto.randomUUID();
      const now = new Date().toISOString();
      const run: RunRow = {
        id: runId,
        user_id: String(args.p_user_id),
        target_id: String(args.p_target_id),
        mode: args.p_mode as "eval" | "csv",
        status: "queued",
        question_set_id: (args.p_question_set_id as string | null) ?? null,
        upload_storage_path:
          (args.p_upload_storage_path as string | null) ?? null,
        prompt_template: (args.p_prompt_template as string | null) ?? null,
        tag: (args.p_tag as string | null) ?? null,
        concurrency: Number(args.p_concurrency ?? 4),
        total_rows: inputs.length,
        completed_rows: 0,
        errored_rows: 0,
        error: null,
        startedAt: now,
        finishedAt: null,
      };
      this.runs.push(run);
      for (const i of inputs) {
        this.rows.push({
          id: crypto.randomUUID(),
          run_id: runId,
          uid: i.uid,
          position: i.position,
          prompt: i.prompt,
          meta: i.meta ?? null,
          status: "queued",
          response_text: null,
          response_json: null,
          langfuse_link: null,
          error: null,
          startedAt: null,
          finishedAt: null,
        });
      }
      return { data: runId, error: null };
    }
    if (name === "bump_chatflow_run_counters") {
      const id = String(args.p_run_id);
      const cd = Number(args.p_completed_delta ?? 0);
      const ed = Number(args.p_errored_delta ?? 0);
      const r = this.runs.find((x) => x.id === id);
      if (!r) return { data: null, error: { message: "no run" } };
      r.completed_rows += cd;
      r.errored_rows += ed;
      return { data: null, error: null };
    }
    return { data: null, error: { message: `unhandled rpc ${name}` } };
  }

  from(table: string) {
    if (table === "chatflow_runs") return new RunsQuery(this);
    if (table === "chatflow_run_rows") return new RunRowsQuery(this);
    throw new Error(`unexpected table ${table}`);
  }
}

abstract class BaseQuery<T> {
  protected op: "select" | "insert" | "update" | "delete" = "select";
  protected filters: Array<{ k: string; op: "eq" | "in"; v: unknown }> = [];
  protected orderField: string | null = null;
  protected orderAsc = true;
  protected payload: Record<string, unknown> | null = null;
  protected limit1Mode: "single" | "maybeSingle" | null = null;
  protected withCount = false;
  protected rangeStart: number | null = null;
  protected rangeEnd: number | null = null;

  protected abstract rows(): T[];
  protected abstract setRows(rows: T[]): void;

  select(_cols: string, opts?: { count?: string }) {
    if (opts?.count === "exact") this.withCount = true;
    return this;
  }
  insert(payload: Record<string, unknown>) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Record<string, unknown>) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(k: string, v: unknown) {
    this.filters.push({ k, op: "eq", v });
    return this;
  }
  in(k: string, v: unknown[]) {
    this.filters.push({ k, op: "in", v });
    return this;
  }
  order(field: string, opts?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }
  range(start: number, end: number) {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this.execute();
  }
  single() {
    this.limit1Mode = "single";
    return this.execute();
  }
  maybeSingle() {
    this.limit1Mode = "maybeSingle";
    return this.execute();
  }
  then<R>(
    onFulfilled?: (
      v: { data: unknown; error: unknown; count?: number | null },
    ) => R | PromiseLike<R>,
    onRejected?: (reason: unknown) => R | PromiseLike<R>,
  ): Promise<R> {
    return this.execute().then(onFulfilled, onRejected);
  }

  protected matches(row: T): boolean {
    return this.filters.every((f) => {
      const v = (row as unknown as Record<string, unknown>)[f.k];
      if (f.op === "eq") return v === f.v;
      return (f.v as unknown[]).includes(v);
    });
  }

  protected async execute(): Promise<{
    data: unknown;
    error: unknown;
    count?: number | null;
  }> {
    if (this.op === "update") {
      const matched = this.rows().filter((r) => this.matches(r));
      const payload = this.payload!;
      for (const r of matched) {
        for (const k of Object.keys(payload)) {
          (r as unknown as Record<string, unknown>)[k] = payload[k];
        }
      }
      return { data: matched.map((r) => ({ ...r })), error: null };
    }
    if (this.op === "delete") {
      this.setRows(this.rows().filter((r) => !this.matches(r)));
      return { data: null, error: null };
    }
    // select
    let result = this.rows().filter((r) => this.matches(r));
    if (this.orderField) {
      const f = this.orderField as keyof T;
      const asc = this.orderAsc;
      result = [...result].sort((a, b) => {
        const av = a[f] as unknown as string | number;
        const bv = b[f] as unknown as string | number;
        if (av === bv) return 0;
        return (av < bv ? -1 : 1) * (asc ? 1 : -1);
      });
    }
    const total = result.length;
    if (this.rangeStart != null && this.rangeEnd != null) {
      result = result.slice(this.rangeStart, this.rangeEnd + 1);
    }
    if (this.limit1Mode === "single") {
      if (result.length === 0)
        return { data: null, error: { message: "no rows" } };
      return { data: result[0], error: null };
    }
    if (this.limit1Mode === "maybeSingle") {
      return { data: result[0] ?? null, error: null };
    }
    return {
      data: result,
      error: null,
      count: this.withCount ? total : null,
    };
  }
}

class RunsQuery extends BaseQuery<RunRow> {
  constructor(private supa: FakeSupabase) {
    super();
  }
  protected rows() {
    return this.supa.runs;
  }
  protected setRows(rows: RunRow[]) {
    this.supa.runs = rows;
  }
}

class RunRowsQuery extends BaseQuery<RunRowRow> {
  constructor(private supa: FakeSupabase) {
    super();
  }
  protected rows() {
    return this.supa.rows;
  }
  protected setRows(rows: RunRowRow[]) {
    this.supa.rows = rows;
  }
}

let fake: FakeSupabase;

beforeEach(async () => {
  fake = new FakeSupabase();
  const mod = await import("../run-store");
  mod.__setClientFactoryForTesting(() => fake as unknown as never);
});

describe("run-store", () => {
  it("createRun inserts a run + one row per input atomically", async () => {
    const { createRun } = await import("../run-store");
    const run = await createRun("user-A", {
      target_id: "target-1",
      mode: "eval",
      inputs: [
        { uid: "u-1", position: 0, prompt: "Q1" },
        { uid: "u-2", position: 1, prompt: "Q2" },
        { uid: "u-3", position: 2, prompt: "Q3" },
      ],
    });
    expect(run.user_id).toBe("user-A");
    expect(run.total_rows).toBe(3);
    expect(fake.runs).toHaveLength(1);
    expect(fake.rows).toHaveLength(3);
    expect(fake.rows.every((r) => r.run_id === run.id)).toBe(true);
  });

  it("createRun rolls back when the RPC rejects (no partial run, no orphan rows)", async () => {
    const { createRun } = await import("../run-store");
    await expect(
      createRun("user-A", {
        target_id: "target-1",
        mode: "eval",
        // @ts-expect-error force-bad uid to trip the simulated tx guard
        inputs: [{ uid: "ok", position: 0, prompt: "Q" }, { uid: "", position: 1, prompt: "Bad" }],
      }),
    ).rejects.toThrow();
    expect(fake.runs).toHaveLength(0);
    expect(fake.rows).toHaveLength(0);
  });

  it("getRunWithRows is user-scoped and returns null for foreign userId", async () => {
    const { createRun, getRunWithRows } = await import("../run-store");
    const run = await createRun("user-A", {
      target_id: "target-1",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    expect(await getRunWithRows("user-A", run.id)).not.toBeNull();
    expect(await getRunWithRows("user-B", run.id)).toBeNull();
  });

  it("listRuns is user-scoped and supports mode/target filters", async () => {
    const { createRun, listRuns } = await import("../run-store");
    await createRun("user-A", {
      target_id: "t1",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    await createRun("user-A", {
      target_id: "t2",
      mode: "csv",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    await createRun("user-B", {
      target_id: "t1",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    const allA = await listRuns("user-A");
    expect(allA.runs).toHaveLength(2);
    const evalA = await listRuns("user-A", { mode: "eval" });
    expect(evalA.runs).toHaveLength(1);
    const t1A = await listRuns("user-A", { targetId: "t1" });
    expect(t1A.runs).toHaveLength(1);
    const allB = await listRuns("user-B");
    expect(allB.runs).toHaveLength(1);
  });

  it("markRunCancelled is a no-op for terminal runs (completed/cancelled/errored)", async () => {
    const { createRun, setRunStatus, markRunCancelled, getRunWithRows } =
      await import("../run-store");
    for (const terminal of ["completed", "cancelled", "errored"] as const) {
      const r = await createRun("user-A", {
        target_id: "t",
        mode: "eval",
        inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
      });
      await setRunStatus(r.id, terminal);
      await markRunCancelled("user-A", r.id);
      const reread = await getRunWithRows("user-A", r.id);
      expect(reread!.run.status).toBe(terminal);
    }
  });

  it("markRunCancelled flips queued/running runs to cancelled", async () => {
    const { createRun, markRunCancelled, getRunWithRows, setRunStatus } =
      await import("../run-store");
    const r1 = await createRun("user-A", {
      target_id: "t",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    await markRunCancelled("user-A", r1.id);
    expect((await getRunWithRows("user-A", r1.id))!.run.status).toBe(
      "cancelled",
    );

    const r2 = await createRun("user-A", {
      target_id: "t",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    await setRunStatus(r2.id, "running");
    await markRunCancelled("user-A", r2.id);
    expect((await getRunWithRows("user-A", r2.id))!.run.status).toBe(
      "cancelled",
    );
  });

  it("markRunCancelled refuses to cancel a foreign user's run", async () => {
    const { createRun, markRunCancelled, getRunWithRows } = await import(
      "../run-store"
    );
    const r = await createRun("user-A", {
      target_id: "t",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    await markRunCancelled("user-B", r.id);
    expect((await getRunWithRows("user-A", r.id))!.run.status).toBe("queued");
  });

  it("incrementRunCounters serializes concurrent updates atomically", async () => {
    const { createRun, incrementRunCounters, getRunWithRows } = await import(
      "../run-store"
    );
    const run = await createRun("user-A", {
      target_id: "t",
      mode: "eval",
      inputs: [{ uid: "u-1", position: 0, prompt: "Q" }],
    });
    const N = 50;
    await Promise.all(
      Array.from({ length: N }, () => incrementRunCounters(run.id, 1, 0)),
    );
    const reread = await getRunWithRows("user-A", run.id);
    expect(reread!.run.completed_rows).toBe(N);
  });

  it("updateRowResult is scoped to (runId, rowId)", async () => {
    const { createRun, updateRowResult } = await import("../run-store");
    const run = await createRun("user-A", {
      target_id: "t",
      mode: "eval",
      inputs: [
        { uid: "u-1", position: 0, prompt: "Q1" },
        { uid: "u-2", position: 1, prompt: "Q2" },
      ],
    });
    const row1 = fake.rows[0];
    await updateRowResult(run.id, row1.id, {
      status: "completed",
      response_text: "answer",
    });
    expect(fake.rows[0].status).toBe("completed");
    expect(fake.rows[0].response_text).toBe("answer");
    expect(fake.rows[1].status).toBe("queued");
  });
});
