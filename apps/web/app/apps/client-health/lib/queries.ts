// Read-side façade for the client-health UI. Server-only — pages import
// these instead of reaching into actions.ts so the read/write split stays
// readable.
export { getClientHealth, listClientHealth } from "../actions";
