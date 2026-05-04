import "server-only";

export interface RollingQueueResult {
  completed: number;
  errored: number;
  cancelled: boolean;
}

export interface RollingQueueOptions<TInput, TResult> {
  items: TInput[];
  concurrency: number;
  signal?: AbortSignal;
  shouldCancel?: () => Promise<boolean> | boolean;
  process: (
    item: TInput,
    index: number,
    signal: AbortSignal,
  ) => Promise<TResult>;
  onComplete?: (
    item: TInput,
    index: number,
    result: TResult | { error: unknown },
  ) => Promise<void>;
}

export async function runRollingQueue<TInput, TResult>(
  opts: RollingQueueOptions<TInput, TResult>,
): Promise<RollingQueueResult> {
  const { items, signal, shouldCancel, process, onComplete } = opts;
  const concurrency = Math.max(1, Math.floor(opts.concurrency));

  if (items.length === 0) {
    return { completed: 0, errored: 0, cancelled: false };
  }

  let completed = 0;
  let errored = 0;
  let cancelled = false;
  let next = 0;

  const inFlight = new Set<Promise<void>>();
  const rowControllers = new Set<AbortController>();

  const cancelAllInFlight = () => {
    for (const c of rowControllers) c.abort();
  };

  const onOuterAbort = () => {
    cancelled = true;
    cancelAllInFlight();
  };

  if (signal) {
    if (signal.aborted) {
      cancelled = true;
    } else {
      signal.addEventListener("abort", onOuterAbort, { once: true });
    }
  }

  const dispatch = (idx: number) => {
    const item = items[idx]!;
    const rowController = new AbortController();
    rowControllers.add(rowController);

    const forwardAbort = () => rowController.abort();
    if (signal) {
      if (signal.aborted) {
        rowController.abort();
      } else {
        signal.addEventListener("abort", forwardAbort, { once: true });
      }
    }

    const promise: Promise<void> = (async () => {
      try {
        const result = await process(item, idx, rowController.signal);
        completed++;
        if (onComplete) {
          try {
            await onComplete(item, idx, result);
          } catch {
            // onComplete failures must not break the engine
          }
        }
      } catch (err) {
        errored++;
        if (onComplete) {
          try {
            await onComplete(item, idx, { error: err });
          } catch {
            // onComplete failures must not break the engine
          }
        }
      }
    })().finally(() => {
      inFlight.delete(promise);
      rowControllers.delete(rowController);
      if (signal) signal.removeEventListener("abort", forwardAbort);
    });

    inFlight.add(promise);
  };

  try {
    while (next < items.length && !cancelled) {
      if (shouldCancel) {
        try {
          if (await shouldCancel()) {
            cancelled = true;
            cancelAllInFlight();
            break;
          }
        } catch {
          // Treat shouldCancel errors as a no-op; the run continues.
        }
      }

      while (
        inFlight.size < concurrency &&
        next < items.length &&
        !cancelled
      ) {
        dispatch(next++);
      }

      if (inFlight.size > 0) {
        await Promise.race(inFlight);
      }
    }

    await Promise.allSettled(inFlight);
  } finally {
    if (signal) signal.removeEventListener("abort", onOuterAbort);
  }

  return { completed, errored, cancelled };
}
