#!/usr/bin/env node
/**
 * One-way sync: tools/ai-team/{skills,rules} -> editor home directories.
 * Source of truth is ALWAYS this repo folder; never edit the synced copies.
 *
 * Usage:
 *   node tools/ai-team/sync.mjs [--dry-run] [--claude]
 *
 * Targets:
 *   skills/    -> ~/.cursor/skills/<name>/                         (always)
 *   rules/     -> ~/.cursor/rules/<file>                           (when rules/ exists; Branch 6)
 *   templates/ -> <skills target>/saas-orchestrator/templates/     (bundled so the
 *                 orchestrator can reach its templates from any repo after sync)
 *   --claude   additionally mirrors skills/ (+ bundled templates) -> ~/.claude/skills/
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const withClaude = args.includes('--claude');

const unknown = args.filter((a) => !['--dry-run', '--claude'].includes(a));
if (unknown.length > 0) {
  console.error(`Unknown option(s): ${unknown.join(' ')}`);
  console.error('Usage: node tools/ai-team/sync.mjs [--dry-run] [--claude]');
  process.exit(1);
}

const skillsSrc = join(here, 'skills');
const rulesSrc = join(here, 'rules');
const templatesSrc = join(here, 'templates');

const skillTargets = [join(homedir(), '.cursor', 'skills')];
if (withClaude) skillTargets.push(join(homedir(), '.claude', 'skills'));
const rulesTarget = join(homedir(), '.cursor', 'rules');

let copied = 0;
let skipped = 0;

function copy(from, to) {
  if (dryRun) {
    console.log(`plan   ${from}  ->  ${to}`);
  } else {
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    console.log(`copy   ${from}  ->  ${to}`);
  }
  copied += 1;
}

function skip(src, why) {
  console.log(`skip   ${src} (${why})`);
  skipped += 1;
}

// 1. Skills -> every skills target (Cursor always, Claude with --claude).
if (existsSync(skillsSrc)) {
  const skillDirs = readdirSync(skillsSrc).filter((name) =>
    statSync(join(skillsSrc, name)).isDirectory()
  );
  for (const target of skillTargets) {
    for (const name of skillDirs) {
      copy(join(skillsSrc, name), join(target, name));
    }
    // Bundle shared templates inside the orchestrator skill so synced skills
    // are self-contained outside this repo.
    if (existsSync(templatesSrc) && skillDirs.includes('saas-orchestrator')) {
      copy(templatesSrc, join(target, 'saas-orchestrator', 'templates'));
    }
  }
} else {
  skip(skillsSrc, 'missing');
}

// 2. Rules -> ~/.cursor/rules (thin always-on standards; created in Branch 6).
if (existsSync(rulesSrc)) {
  const ruleFiles = readdirSync(rulesSrc).filter((name) =>
    statSync(join(rulesSrc, name)).isFile()
  );
  for (const name of ruleFiles) {
    copy(join(rulesSrc, name), join(rulesTarget, name));
  }
} else {
  skip(rulesSrc, 'missing - rules arrive in Branch 6');
}

const verb = dryRun ? 'would be copied' : 'copied';
console.log(`\n${dryRun ? '[dry-run] ' : ''}${copied} item(s) ${verb}, ${skipped} source(s) skipped.`);
