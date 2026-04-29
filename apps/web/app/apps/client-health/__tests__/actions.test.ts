import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@repo/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  },
}));

// In-memory store that simulates RLS. Each query is scoped to currentUserId,
// so cross-user reads/updates/deletes return zero rows / no-ops just like
// the real database with row-level security would.
type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  status: string;
  contractStatus: string | null;
  contractEndDate: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClientSiteRow = {
  id: string;
  user_id: string;
  clientId: string;
  label: string;
  url: string;
  isPrimary: boolean;
  openTicketCount: number;
  ticketsLastUpdated: string | null;
  createdAt: string;
  updatedAt: string;
};

type SiteRow = { id: string; url: string; status: string; uptimePercent: number | null; responseTimeMs: number | null; lastChecked: string | null; name: string | null; description: string | null };
type MetaRow = { url: string; sslExpiry: string | null; sslIssuer: string | null; sslLastChecked: string | null; sslLastError: string | null; notes: string | null; createdAt: string; updatedAt: string };

const store: {
  clients: ClientRow[];
  client_sites: ClientSiteRow[];
  sites: SiteRow[];
  site_metadata: MetaRow[];
} = {
  clients: [],
  client_sites: [],
  sites: [],
  site_metadata: [],
};

let currentUserId = "user-a";
let nextId = 1;

function uuid(): string {
  // Deterministic uuid-shaped string
  const n = String(nextId++).padStart(12, "0");
  return `00000000-0000-4000-8000-${n}`;
}

type Filter = (row: Record<string, unknown>) => boolean;

function tableUserCol(table: string): string | null {
  if (table === "clients" || table === "client_sites") return "user_id";
  return null;
}

function makeBuilder(table: string, filters: Filter[] = []) {
  const all = () => {
    const data = store[table as keyof typeof store] as Record<string, unknown>[];
    const userCol = tableUserCol(table);
    const scoped = userCol
      ? data.filter((r) => r[userCol] === currentUserId)
      : data;
    return scoped.filter((r) => filters.every((f) => f(r)));
  };

  const builder: Record<string, unknown> = {
    select() {
      return makeBuilder(table, filters);
    },
    eq(col: string, val: unknown) {
      return makeBuilder(table, [...filters, (r) => r[col] === val]);
    },
    in(col: string, vals: unknown[]) {
      return makeBuilder(table, [
        ...filters,
        (r) => vals.includes(r[col]),
      ]);
    },
    order() {
      return makeBuilder(table, filters);
    },
    async single() {
      const rows = all();
      if (rows.length === 0) {
        return { data: null, error: { message: "no rows", code: "PGRST116" } };
      }
      return { data: rows[0], error: null };
    },
    async maybeSingle() {
      const rows = all();
      return { data: rows[0] ?? null, error: null };
    },
    then(onfulfilled?: (v: { data: unknown[]; error: null }) => unknown) {
      return Promise.resolve({ data: all(), error: null }).then(onfulfilled);
    },
  };
  return builder;
}

const mockSupabase = {
  from(table: string) {
    return {
      select(_cols?: string) {
        void _cols;
        return makeBuilder(table);
      },
      insert(payload: Record<string, unknown>) {
        const row = { ...payload };
        const userCol = tableUserCol(table);
        if (userCol) row[userCol] = currentUserId;
        if (!row.id) row.id = uuid();
        const now = new Date().toISOString();
        if (!row.createdAt) row.createdAt = now;
        if (!row.updatedAt) row.updatedAt = now;
        if (table === "client_sites") {
          // Mirror DB defaults so cross-user assertions don't see undefined.
          if (row.openTicketCount === undefined) row.openTicketCount = 0;
          if (row.isPrimary === undefined) row.isPrimary = false;
          if (row.ticketsLastUpdated === undefined) row.ticketsLastUpdated = null;
        }

        // Simulate the (user_id, clientId, url) unique constraint.
        if (table === "client_sites") {
          const dupe = (
            store.client_sites as ClientSiteRow[]
          ).find(
            (r) =>
              r.user_id === currentUserId &&
              r.clientId === row.clientId &&
              r.url === row.url,
          );
          if (dupe) {
            return {
              select() {
                return {
                  async single() {
                    return {
                      data: null,
                      error: {
                        code: "23505",
                        message: "duplicate key value violates unique constraint",
                      },
                    };
                  },
                };
              },
            };
          }
        }

        (store[table as keyof typeof store] as Record<string, unknown>[]).push(row);
        return {
          select() {
            return {
              async single() {
                return { data: row, error: null };
              },
            };
          },
        };
      },
      update(patch: Record<string, unknown>) {
        return {
          eq(col: string, val: unknown) {
            const userCol = tableUserCol(table);
            const data = store[table as keyof typeof store] as Record<
              string,
              unknown
            >[];
            let updated: Record<string, unknown> | null = null;
            for (const row of data) {
              if (row[col] === val && (!userCol || row[userCol] === currentUserId)) {
                Object.assign(row, patch);
                updated = row;
              }
            }
            return {
              select() {
                return {
                  async single() {
                    if (!updated) {
                      return {
                        data: null,
                        error: { message: "no rows", code: "PGRST116" },
                      };
                    }
                    return { data: updated, error: null };
                  },
                };
              },
            };
          },
        };
      },
      delete() {
        return {
          async eq(col: string, val: unknown) {
            const userCol = tableUserCol(table);
            const data = store[table as keyof typeof store] as Record<
              string,
              unknown
            >[];
            const before = data.length;
            const filtered = data.filter(
              (row) =>
                !(
                  row[col] === val &&
                  (!userCol || row[userCol] === currentUserId)
                ),
            );
            (store[table as keyof typeof store] as unknown[]).length = 0;
            for (const row of filtered) {
              (store[table as keyof typeof store] as unknown[]).push(row);
            }
            const removed = before - filtered.length;
            return { data: null, error: null, count: removed };
          },
        };
      },
    };
  },
};

vi.mock("@repo/db/server", () => ({
  createClient: async () => mockSupabase,
}));

import {
  createClient,
  updateClient,
  deleteClient,
  addClientSite,
  updateClientSite,
  deleteClientSite,
  setOpenTicketCount,
  listClientHealth,
  getClientHealth,
} from "../actions";

beforeEach(() => {
  store.clients = [];
  store.client_sites = [];
  store.sites = [];
  store.site_metadata = [];
  nextId = 1;
  currentUserId = "user-a";
  vi.clearAllMocks();
});

describe("createClient", () => {
  it("creates a client scoped to the current user", async () => {
    const result = await createClient({ name: "Acme" });
    expect(result.ok).toBe(true);
    expect(store.clients).toHaveLength(1);
    expect(store.clients[0]).toMatchObject({ name: "Acme", user_id: "user-a" });
  });

  it("rejects empty name via zod", async () => {
    const result = await createClient({ name: "" });
    expect(result).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects invalid email via zod", async () => {
    const result = await createClient({
      name: "Acme",
      primaryContactEmail: "not-an-email",
    });
    expect(result.ok).toBe(false);
  });
});

describe("updateClient — RLS isolation", () => {
  it("user B cannot update user A's client", async () => {
    const created = await createClient({ name: "A's company" });
    expect(created.ok).toBe(true);
    const id = created.ok ? created.data.id : "";

    currentUserId = "user-b";
    const updated = await updateClient(id, { name: "Hijacked" });
    expect(updated.ok).toBe(false);

    currentUserId = "user-a";
    expect(store.clients[0].name).toBe("A's company");
  });

  it("rejects invalid uuid", async () => {
    const result = await updateClient("not-a-uuid", { name: "X" });
    expect(result).toEqual({ ok: false, error: "Invalid client id" });
  });
});

describe("deleteClient — RLS isolation", () => {
  it("user B cannot delete user A's client", async () => {
    const created = await createClient({ name: "Client A" });
    const id = created.ok ? created.data.id : "";

    currentUserId = "user-b";
    await deleteClient(id);
    expect(store.clients).toHaveLength(1);

    currentUserId = "user-a";
    const result = await deleteClient(id);
    expect(result.ok).toBe(true);
    expect(store.clients).toHaveLength(0);
  });
});

describe("addClientSite", () => {
  let clientId: string;

  beforeEach(async () => {
    const c = await createClient({ name: "Acme" });
    clientId = c.ok ? c.data.id : "";
  });

  it("adds a site scoped to the current user", async () => {
    const result = await addClientSite({
      clientId,
      label: "Main",
      url: "https://example.com",
    });
    expect(result.ok).toBe(true);
    expect(store.client_sites).toHaveLength(1);
    expect(store.client_sites[0]).toMatchObject({
      clientId,
      url: "https://example.com",
      user_id: "user-a",
    });
  });

  it("returns a friendly error on duplicate (user_id, clientId, url)", async () => {
    await addClientSite({
      clientId,
      label: "Main",
      url: "https://example.com",
    });
    const result = await addClientSite({
      clientId,
      label: "Dup",
      url: "https://example.com",
    });
    expect(result).toEqual({
      ok: false,
      error: "A site with this URL already exists for this client.",
    });
  });

  it("rejects invalid url via zod", async () => {
    const result = await addClientSite({
      clientId,
      label: "Main",
      url: "not-a-url",
    });
    expect(result.ok).toBe(false);
  });

  it("user B cannot read user A's sites (cross-user RLS)", async () => {
    await addClientSite({
      clientId,
      label: "Main",
      url: "https://example.com",
    });

    currentUserId = "user-b";
    const payload = await listClientHealth();
    expect(payload).toEqual([]);
  });
});

describe("updateClientSite — RLS isolation", () => {
  it("user B cannot update user A's site", async () => {
    const c = await createClient({ name: "A's company" });
    const cid = c.ok ? c.data.id : "";
    const s = await addClientSite({
      clientId: cid,
      label: "Main",
      url: "https://example.com",
    });
    const sid = s.ok ? s.data.id : "";

    currentUserId = "user-b";
    const result = await updateClientSite(sid, { label: "Hijacked" });
    expect(result.ok).toBe(false);

    currentUserId = "user-a";
    expect(store.client_sites[0].label).toBe("Main");
  });
});

describe("deleteClientSite", () => {
  it("deletes only the caller's site", async () => {
    const c = await createClient({ name: "A" });
    const cid = c.ok ? c.data.id : "";
    const s = await addClientSite({
      clientId: cid,
      label: "Main",
      url: "https://example.com",
    });
    const sid = s.ok ? s.data.id : "";

    currentUserId = "user-b";
    await deleteClientSite(sid);
    expect(store.client_sites).toHaveLength(1);

    currentUserId = "user-a";
    const result = await deleteClientSite(sid);
    expect(result.ok).toBe(true);
    expect(store.client_sites).toHaveLength(0);
  });
});

describe("setOpenTicketCount", () => {
  it("updates the ticket count and timestamp", async () => {
    const c = await createClient({ name: "A" });
    const cid = c.ok ? c.data.id : "";
    const s = await addClientSite({
      clientId: cid,
      label: "Main",
      url: "https://example.com",
    });
    const sid = s.ok ? s.data.id : "";

    const result = await setOpenTicketCount({ siteId: sid, count: 7 });
    expect(result.ok).toBe(true);
    expect(store.client_sites[0].openTicketCount).toBe(7);
    expect(store.client_sites[0].ticketsLastUpdated).toBeTruthy();
  });

  it("rejects negative counts via zod", async () => {
    const result = await setOpenTicketCount({
      siteId: "00000000-0000-4000-8000-000000000001",
      count: -1,
    });
    expect(result.ok).toBe(false);
  });

  it("user B cannot bump user A's ticket count", async () => {
    const c = await createClient({ name: "A" });
    const cid = c.ok ? c.data.id : "";
    const s = await addClientSite({
      clientId: cid,
      label: "Main",
      url: "https://example.com",
    });
    const sid = s.ok ? s.data.id : "";

    currentUserId = "user-b";
    const result = await setOpenTicketCount({ siteId: sid, count: 99 });
    expect(result.ok).toBe(false);
    currentUserId = "user-a";
    expect(store.client_sites[0].openTicketCount).toBe(0);
  });
});

describe("listClientHealth", () => {
  it("returns an empty array when the user has no clients", async () => {
    const result = await listClientHealth();
    expect(result).toEqual([]);
  });

  it("returns the assembled per-client payload shape", async () => {
    const c = await createClient({
      name: "Acme",
      contractStatus: "active",
    });
    const cid = c.ok ? c.data.id : "";
    await addClientSite({
      clientId: cid,
      label: "Main",
      url: "https://example.com",
      isPrimary: true,
    });
    store.sites.push({
      id: "site-1",
      url: "https://example.com",
      status: "up",
      uptimePercent: 99.9,
      responseTimeMs: 200,
      lastChecked: null,
      name: null,
      description: null,
    });
    store.site_metadata.push({
      url: "https://example.com",
      sslExpiry: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      sslIssuer: null,
      sslLastChecked: null,
      sslLastError: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await listClientHealth();
    expect(result).toHaveLength(1);
    expect(result[0].client.name).toBe("Acme");
    expect(result[0].sites).toHaveLength(1);
    expect(result[0].sites[0]).toMatchObject({
      url: "https://example.com",
      status: "up",
      uptime: 99.9,
      responseTime: 200,
    });
    expect(typeof result[0].score.score).toBe("number");
    expect(result[0].score.breakdown).toHaveProperty("uptime");
  });

  it("only returns the caller's clients (cross-user RLS)", async () => {
    await createClient({ name: "A's company" });

    currentUserId = "user-b";
    const result = await listClientHealth();
    expect(result).toEqual([]);
  });
});

describe("getClientHealth", () => {
  it("returns null for invalid uuid", async () => {
    const result = await getClientHealth("not-a-uuid");
    expect(result).toBeNull();
  });

  it("returns null when fetching another user's client", async () => {
    const c = await createClient({ name: "A's company" });
    const cid = c.ok ? c.data.id : "";

    currentUserId = "user-b";
    const result = await getClientHealth(cid);
    expect(result).toBeNull();
  });

  it("returns a single payload for the caller's client", async () => {
    const c = await createClient({ name: "Acme" });
    const cid = c.ok ? c.data.id : "";

    const result = await getClientHealth(cid);
    expect(result).not.toBeNull();
    expect(result!.client.name).toBe("Acme");
    expect(result!.sites).toEqual([]);
  });
});
