import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LOG_PATH = path.join(os.homedir(), 'Repo/Personal AI/combat_nutrition_coach/daily_log.md');
const DEBOUNCE_MS = 800;
const POLL_INTERVAL_MS = 1000;

function resolveLogPath() {
  const configuredPath = process.env.DAILY_LOG_PATH || process.env.SYNC_LOG_PATH;
  if (!configuredPath) return DEFAULT_LOG_PATH;
  if (configuredPath.startsWith('~/')) {
    return path.join(os.homedir(), configuredPath.slice(2));
  }
  return path.resolve(configuredPath);
}

const LOG_PATH = resolveLogPath();
const LOG_DIR = path.dirname(LOG_PATH);
const LOG_FILE = path.basename(LOG_PATH);
let debounce = null;
let running = false;
let queuedRun = false;

function runSync(reason = 'change') {
  if (running) {
    queuedRun = true;
    return;
  }
  running = true;
  console.log(`[watch] Change detected (${reason}) — syncing...`);
  const proc = spawn('node', [path.join(__dirname, 'sync_logs.js')], { stdio: 'inherit' });
  proc.on('close', code => {
    running = false;
    if (code === 0) {
      console.log('[watch] Done. Watching for changes...\n');
    } else {
      console.error(`[watch] Sync failed (exit ${code}). Watching for changes...\n`);
    }
    if (queuedRun) {
      queuedRun = false;
      runSync('queued');
    }
  });
}

function scheduleSync(reason = 'change') {
  clearTimeout(debounce);
  debounce = setTimeout(() => runSync(reason), DEBOUNCE_MS);
}

if (!fs.existsSync(LOG_PATH)) {
  console.warn(`[watch] Log file not found yet: ${LOG_PATH}`);
  console.warn('[watch] Waiting for file creation and future changes.\n');
}

console.log(`[watch] Watching ${LOG_PATH}`);
console.log(`[watch] Strategies: fs.watch (${LOG_DIR}) + fs.watchFile polling (${POLL_INTERVAL_MS}ms)\n`);
runSync();

const dirWatcher = fs.watch(LOG_DIR, (eventType, filename) => {
  if (filename && filename.toString() !== LOG_FILE) return;
  scheduleSync(`fs.watch:${eventType}`);
});

fs.watchFile(LOG_PATH, { interval: POLL_INTERVAL_MS }, (curr, prev) => {
  if (curr.mtimeMs === prev.mtimeMs && curr.size === prev.size) return;
  scheduleSync('fs.watchFile');
});

process.on('SIGINT', () => {
  dirWatcher.close();
  fs.unwatchFile(LOG_PATH);
  process.exit(0);
});
