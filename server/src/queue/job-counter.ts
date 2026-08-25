export type JobType = 'export' | 'report' | 'import';

/**
 * Simple in-process counter for active background-style jobs.
 * LIMIT: per-process counter only; for multi-instance deployments,
 * replace with a Redis-backed counter or a shared semaphore.
 */
export class JobCounter {
  private readonly counts = new Map<JobType, number>();

  increment(type: JobType): void {
    this.counts.set(type, (this.counts.get(type) ?? 0) + 1);
  }

  decrement(type: JobType): void {
    this.counts.set(type, Math.max(0, (this.counts.get(type) ?? 0) - 1));
  }

  get(type: JobType): number {
    return this.counts.get(type) ?? 0;
  }
}

export const jobCounter = new JobCounter();
