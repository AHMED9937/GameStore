import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);
const webPort = process.env['E2E_WEB_PORT'] ?? '4200';
const apiUrl = process.env['API_URL'] ?? 'http://localhost:3333';

function waitFor(url, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve(undefined);
            return;
          }
          retry();
        })
        .on('error', retry);
    };

    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timeout waiting for ${url}`));
        return;
      }
      setTimeout(check, 500);
    };

    check();
  });
}

function spawnLogged(command, args, env) {
  return spawn(command, args, {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: true,
    env,
  });
}

const sharedEnv = {
  ...process.env,
  API_URL: apiUrl,
};

const api = spawnLogged('pnpm', ['nx', 'serve', 'api'], sharedEnv);
await waitFor(`${apiUrl}/api/games`);

const web = spawnLogged(
  'pnpm',
  ['nx', 'start', 'web', '--', '--port', webPort],
  sharedEnv,
);
await waitFor(`http://localhost:${webPort}`);

function shutdown() {
  api.kill('SIGTERM');
  web.kill('SIGTERM');
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
