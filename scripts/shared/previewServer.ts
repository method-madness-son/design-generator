/**
 * Shared Next.js preview server and Chromium launch options.
 *
 * Tee, mug, and KDP export scripts should import this instead of copying it.
 * Product scripts keep their own routes, manifests, and file writers.
 *
 *   import { chromiumLaunchOptions, startNext, stopNext, waitForServer } from './shared/previewServer';
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { LaunchOptions } from 'playwright';

export const chromiumLaunchOptions: LaunchOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
};

export async function waitForServer(url: string, child: ChildProcess | null, logPath: string): Promise<void> {
  const deadline = Date.now() + 180_000;
  let lastStatus = 'not up';
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) {
      throw new Error(`next dev exited with ${child.exitCode}. See ${logPath}`);
    }
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
      lastStatus = `HTTP ${response.status}`;
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url} (${lastStatus}).`);
}

export function startNext(port: number, logPath: string): ChildProcess {
  const logFd = fs.openSync(logPath, 'w');
  const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');
  const child = spawn(nextBin, ['dev', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  child.unref();
  return child;
}

export function stopNext(child: ChildProcess | null): void {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
}
