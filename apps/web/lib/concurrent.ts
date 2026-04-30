// Tiny zero-dependency p-limit/semaphore for bounding in-flight async tasks.
//
// Usage:
//   const limit = pLimit(10);
//   const results = await Promise.all(urls.map((url) => limit(() => check(url))));

export type Limiter = <T>(fn: () => Promise<T>) => Promise<T>;

export function pLimit(concurrency: number): Limiter {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`pLimit: concurrency must be a positive integer, got ${concurrency}`);
  }

  let active = 0;
  const queue: Array<() => void> = [];

  const next = (): void => {
    active -= 1;
    const resume = queue.shift();
    if (resume) resume();
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const run = (): void => {
        active += 1;
        Promise.resolve()
          .then(fn)
          .then(
            (value) => {
              resolve(value);
              next();
            },
            (err) => {
              reject(err);
              next();
            },
          );
      };

      if (active < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  };
}
