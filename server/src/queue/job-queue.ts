import { randomUUID } from 'node:crypto';

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
}

export interface JobQueue {
  enqueue<T>(type: string, payload: T): Promise<string>;
  process<T>(type: string, handler: (job: Job<T>, signal: AbortSignal) => Promise<void>): void;
}

type Handler = (job: Job<unknown>, signal: AbortSignal) => Promise<void>;

interface QueuedJob {
  id: string;
  type: string;
  payload: unknown;
}

// LIMIT: in-process queue is single-node and loses jobs on restart;
// the upgrade path is Redis/Bull/SQS.
export class InProcessJobQueue implements JobQueue {
  private readonly handlers = new Map<string, Handler>();
  private readonly queue: QueuedJob[] = [];
  private readonly activeControllers = new Map<string, AbortController>();
  private running = false;
  private stopped = false;

  process<T>(type: string, handler: (job: Job<T>, signal: AbortSignal) => Promise<void>): void {
    this.handlers.set(type, handler as unknown as Handler);
    this.drain();
  }

  enqueue<T>(type: string, payload: T): Promise<string> {
    if (this.stopped) {
      return Promise.reject(new Error(`Queue is stopped; cannot enqueue ${type}`));
    }

    const id = randomUUID();
    this.queue.push({ id, type, payload });
    this.drain();
    return Promise.resolve(id);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;

    for (const controller of this.activeControllers.values()) {
      controller.abort();
    }
  }

  private drain(): void {
    if (this.running || this.queue.length === 0 || this.stopped) return;
    this.running = true;
    setTimeout(() => this.runOne(), 0);
  }

  private runOne(): void {
    const job = this.queue.shift();
    if (!job) {
      this.running = false;
      return;
    }

    const handler = this.handlers.get(job.type);
    if (!handler) {
      // No handler yet; put the job back and wait for one to be registered.
      this.queue.unshift(job);
      this.running = false;
      return;
    }

    const controller = new AbortController();
    this.activeControllers.set(job.id, controller);

    handler({ id: job.id, type: job.type, payload: job.payload }, controller.signal)
      .catch(() => {
        // Handler errors are isolated so the queue keeps processing.
      })
      .finally(() => {
        this.activeControllers.delete(job.id);
        this.running = false;
        this.drain();
      });
  }
}
