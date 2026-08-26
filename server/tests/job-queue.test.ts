import { describe, it, expect } from '@jest/globals';
import { InProcessJobQueue } from '../src/queue/job-queue.js';

function flush(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('InProcessJobQueue', () => {
  it('enqueues a job and returns a UUID id', async () => {
    const queue = new InProcessJobQueue();
    const handled: string[] = [];
    queue.process('test', async (job) => {
      handled.push(job.id);
    });

    const id = await queue.enqueue('test', { value: 1 });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    await flush();
    expect(handled).toEqual([id]);
  });

  it('processes jobs in FIFO order', async () => {
    const queue = new InProcessJobQueue();
    const handled: string[] = [];
    queue.process('test', async (job) => {
      handled.push(job.id);
    });

    const first = await queue.enqueue('test', 1);
    const second = await queue.enqueue('test', 2);
    const third = await queue.enqueue('test', 3);

    await flush();
    expect(handled).toEqual([first, second, third]);
  });

  it('isolates handler errors and continues processing', async () => {
    const queue = new InProcessJobQueue();
    const handled: string[] = [];
    queue.process('test', async (job) => {
      if (job.payload === 'fail') throw new Error('boom');
      handled.push(job.id);
    });

    const first = await queue.enqueue('test', 'ok');
    await queue.enqueue('test', 'fail');
    const third = await queue.enqueue('test', 'ok');

    await flush();
    expect(handled).toEqual([first, third]);
  });

  it('processes a job after its handler is registered', async () => {
    const queue = new InProcessJobQueue();
    const id = await queue.enqueue('test', 1);

    await flush();

    const handled: string[] = [];
    queue.process('test', async (job) => {
      handled.push(job.id);
    });

    await flush();
    expect(handled).toEqual([id]);
  });

  it('stops accepting new jobs when stopped', async () => {
    const queue = new InProcessJobQueue();
    queue.stop();
    await expect(queue.enqueue('test', 1)).rejects.toThrow(/stopped/i);
  });
});
