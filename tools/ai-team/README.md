# AI Team — reusable SaaS build skills

The source of truth for the 13-person expert skill team defined in
[docs/saas-ai-build-system-blueprint.md](../../docs/saas-ai-build-system-blueprint.md), built branch-by-branch per
[docs/saas-ai-build-system-implementation-plan.md](../../docs/saas-ai-build-system-implementation-plan.md).

Skills are **authored and version-controlled here**, then synced outward to the editor's
home directories. Never edit the synced copies — they get overwritten on the next sync.

## Layout

```text
tools/ai-team/
├── README.md          # this file
├── sync.mjs           # one-way sync to ~/.cursor and (optionally) ~/.claude
├── skills/            # one folder per expert, each with SKILL.md
├── rules/             # thin always-on standards (arrive in Branch 6)
├── templates/         # Person Spec, Product Spec Pack, Slice Spec, Global Setup
└── dry-runs/          # branch verification transcripts (build evidence, not product docs)
```

## Sync

```bash
node tools/ai-team/sync.mjs --dry-run   # print what would be copied, copy nothing
node tools/ai-team/sync.mjs             # skills -> ~/.cursor/skills, rules -> ~/.cursor/rules
node tools/ai-team/sync.mjs --claude    # also mirror skills -> ~/.claude/skills (Claude Code)
```

Notes:

- Sync is **one-way outward** (repo → home). There is no pull-back; if a synced copy was
  edited by hand, the edit is lost on the next sync — that is intentional.
- `templates/` is bundled into `<target>/saas-orchestrator/templates/` so the orchestrator
  can copy pack/slice templates into any product repo, even ones that never saw this repo.
- Never sync into `~/.cursor/skills-cursor/` (forbidden by the blueprint).

## Starting a new product with the team

1. On this machine, run `node tools/ai-team/sync.mjs` (add `--claude` if you use Claude Code).
2. Create/open the new product repo in your editor.
3. Invoke **saas-orchestrator** (e.g. "start the pack for <idea>").
4. The orchestrator's first action is to analyze the repo structure and map it to the
   stack profile; then it walks the Product Spec Pack in order (1→7) with its gates:
   MVP approval → style freeze → ERD → backlog freeze.
5. After backlog freeze comes **Global Setup** (one-time infra bootstrap: GitHub repo +
   first push, Nx web/api scaffolds, Neon, Clerk, Stripe, Vercel + Railway, security
   skeleton). No slice opens before this checklist is green.
6. Then the slice loop, one slice at a time: **Pre-Slice Setup ritual** (each required
   expert ultra-thinks + refreshes best practices for this slice) → Spec → freeze →
   Align → Build → tests green → **Ship = deploy + smoke + push to GitHub**.

## Working on the team itself

- One branch at a time per the implementation plan; one slice = one commit
  (`feat(ai-team): S1.4 ...`).
- A branch merges only when its merge gate passes, including its dry-run slice.
- Dry-run evidence lives in `dry-runs/`; toy-app artifacts die after Branch 5.

## Retro (filled during Branch 7)

_Pending — captured after the pilot run._
