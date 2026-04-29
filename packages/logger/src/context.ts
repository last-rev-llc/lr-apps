import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId?: string;
  userId?: string;
  appSlug?: string;
  route?: string;
  [key: string]: unknown;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function withRequestContext<T>(
  ctx: RequestContext,
  fn: () => T,
): T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
