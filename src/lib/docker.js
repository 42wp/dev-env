// Thin wrappers around the `docker` / `docker compose` CLIs using node:child_process.
// Args are always passed as arrays (never through a shell), so project names and
// WP-CLI arguments can't be reinterpreted by the shell.

import { spawn } from 'node:child_process';

// Run a command, streaming its stdio to the user. Resolves on exit 0, rejects otherwise.
export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

// Run a command with `input` piped to its stdin, streaming stdout/stderr to the
// user. Used to feed a PHP script to `docker exec -i ... wp eval-file -`.
export function runWithInput(cmd, args, input, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
    child.stdin.write(input);
    child.stdin.end();
  });
}

// Run a command quietly and capture its output. Never rejects on a non-zero exit;
// callers inspect `.code`. Rejects only if the binary can't be spawned at all.
export function capture(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }),
    );
  });
}

// `docker info` succeeds only when the daemon is reachable.
export async function dockerIsRunning() {
  try {
    const { code } = await capture('docker', ['info']);
    return code === 0;
  } catch {
    // docker binary not found
    return false;
  }
}

// True when a container matching the given name is currently running.
export async function containerIsRunning(name) {
  const { code, stdout } = await capture('docker', [
    'ps',
    '-q',
    '-f',
    `name=^${name}$`,
  ]);
  return code === 0 && stdout.length > 0;
}

// `docker compose -f <file> ...` (or, when cwd is set, `docker compose ...`).
export function compose(args, opts = {}) {
  return run('docker', ['compose', ...args], opts);
}

export function composeCapture(args, opts = {}) {
  return capture('docker', ['compose', ...args], opts);
}

// `docker exec [-i] [-t] <container> <cmd...>`
export function dockerExec(container, cmdArgs, { interactive = false } = {}) {
  const flags = [];
  if (interactive) {
    flags.push('-i');
    if (process.stdout.isTTY) flags.push('-t'); // -t only with a real TTY, so piping works
  }
  return run('docker', ['exec', ...flags, container, ...cmdArgs]);
}

export function dockerExecCapture(container, cmdArgs) {
  return capture('docker', ['exec', container, ...cmdArgs]);
}
