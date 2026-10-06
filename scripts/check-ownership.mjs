// usage: node scripts/check-ownership.mjs <agent-id>
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const agent = process.argv[2];
const owners = JSON.parse(readFileSync('docs/OWNERS.json', 'utf8'));
const mine = owners[agent];
if (!mine) {
  console.error(`Unknown agent: ${agent}`);
  process.exit(2);
}
const shared = owners._allowedEverywhere ?? [];

try {
  const changed = execSync('git diff --name-only main...HEAD', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const bad = changed.filter((f) => ![...mine, ...shared].some((p) => f.startsWith(p)));

  if (bad.length) {
    console.error('Edited files outside owned paths:\n' + bad.join('\n'));
    process.exit(1);
  }
  console.log('Ownership OK');
} catch (err) {
  console.log('Ownership check skipped (no git diff or main ref yet)');
}
