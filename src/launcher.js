import * as pty from 'node-pty';
import { execSync } from 'child_process';
import { realpathSync } from 'fs';
import { ShadowTerminal } from './shadow.js';
import { Compositor } from './compositor.js';
import { createIPCServer } from './ipc.js';
import { loadAnimation } from './animations/loader.js';

function resolveCommand(cmd) {
  try {
    const whichPath = execSync(`which ${cmd}`, { encoding: 'utf-8' }).trim();
    // Resolve symlinks to get the real binary path
    return realpathSync(whichPath);
  } catch {
    return cmd;
  }
}

export async function start(config, claudeArgs = []) {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;

  // Clear screen so the real terminal and shadow terminal start in sync.
  // Without this, existing terminal content causes the real terminal to
  // scroll at different times than the shadow, misaligning row lookups.
  process.stdout.write('\x1b[2J\x1b[H');

  // Initialize shadow terminal
  const shadow = new ShadowTerminal(cols, rows);

  // Initialize compositor
  const compositor = new Compositor(config.fps);

  // Load animation
  const animation = await loadAnimation(config.visual, config);

  // Spawn Claude on a PTY
  const claudeCommand = resolveCommand('claude');
  const ptyProcess = pty.spawn(claudeCommand, claudeArgs, {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: process.cwd(),
    env: { ...process.env },
  });

  // Set stdin to raw mode
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  // IPC server for hook communication
  const ipc = createIPCServer(
    () => {
      // start overlay
      compositor.start(animation, shadow, process.stdout);
    },
    () => {
      // stop overlay
      compositor.stop(shadow, process.stdout);
    }
  );

  // Claude output → forward to BOTH real terminal and shadow terminal
  // Clear overlay before writing so clean content enters scrollback
  ptyProcess.onData((data) => {
    if (compositor.running) compositor.clearOverlay(shadow, process.stdout);
    process.stdout.write(data);
    shadow.write(data);
    if (compositor.running) compositor.redrawOverlay(process.stdout);
  });

  // User input → forward to Claude
  process.stdin.on('data', (data) => {
    ptyProcess.write(data);
  });

  // Resize handling
  process.stdout.on('resize', () => {
    const newCols = process.stdout.columns;
    const newRows = process.stdout.rows;
    ptyProcess.resize(newCols, newRows);
    shadow.resize(newCols, newRows);
    compositor.resize(newCols, newRows);
  });

  // Cleanup on exit
  const cleanup = (exitCode) => {
    compositor.stop(shadow, process.stdout);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }

    // Restore terminal state
    process.stdout.write('\x1b[?25h'); // show cursor
    process.stdout.write('\x1b[0m');   // reset style

    ipc.cleanup();
    shadow.dispose();

    process.exit(exitCode ?? 0);
  };

  ptyProcess.onExit(({ exitCode }) => {
    cleanup(exitCode);
  });

  // Handle signals
  process.on('SIGINT', () => {
    // Forward to PTY, don't exit ourselves
    ptyProcess.write('\x03');
  });

  process.on('SIGTERM', () => {
    ptyProcess.kill();
    cleanup(1);
  });

  // Handle unexpected exits
  process.on('exit', () => {
    ipc.cleanup();
  });
}
