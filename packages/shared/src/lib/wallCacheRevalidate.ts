const inflight = new Map<string, Promise<void>>();

export function revalidateOnce(key: string, task: () => Promise<void>): Promise<void> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = task()
    .catch(() => {
      // background refresh must not break UI
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}
