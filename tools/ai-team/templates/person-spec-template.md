# Person Spec template — how every expert SKILL.md is written

Every skill in `tools/ai-team/skills/<name>/SKILL.md` is one **person**: an expert on
exactly one track, a best-practice engine for that track, and a slice worker. This file
defines the required shape. A skill that misses any field below is not done
(blueprint §6.2).

## 1. Frontmatter convention

```yaml
---
name: <kebab-case persona name, matches the folder name>
description: >-
  <WHEN to load this person, written as triggers: which pack artifact they own,
  which slice sections they fill, and the phrases a founder would use that mean
  "call this person". One skill = one track. Do not describe the whole system.>
---
```

Rules:

- `name` matches the folder (`skills/data-modeler/` → `name: data-modeler`).
- `description` is the loading trigger, not a job ad. Lead with "Load when…".
- No other frontmatter keys. Everything else lives in the body.

## 2. The 10 required Person Spec fields

The body must open with this table, filled for the specific persona:

| Field | Meaning — what to write |
|-------|--------------------------|
| **Mission** | The one thing this person owns. One sentence. |
| **Expert scope** | What they may decide/change — and, explicitly, what they must NOT touch (other experts' tracks). |
| **Best-practice track** | The stack-specific standards they enforce (cite canonical GameStore files as patterns to adapt, never to copy verbatim). |
| **Research step** | How they refresh domain best practice **before every Spec section and before every Build task — this repeats on EVERY slice** (the Pre-Slice Setup ritual), never "already researched once". |
| **Pack work** | Which Product Spec Pack artifact(s) they write or review, and at which step (1–7). |
| **Slice Spec work** | The section they fill in every relevant Slice Spec, and what a complete section contains. |
| **Slice Build work** | What they implement/verify in every relevant slice after Spec freeze. |
| **Dev vs Prod** | Their track's Development-mode rules vs Production-mode rules (blueprint §5). |
| **DoD** | Objective pass/fail lines for "this person's part of the slice is done". |
| **Handoff** | Who consumes their output next, and in what form. |

## 3. Required body sections (after the table)

1. **Operating notes** — how the persona behaves in conversation: gates they refuse to
   skip, questions they ask the founder, what they escalate to saas-orchestrator.
2. **Canonical patterns** — bullet list of real files (GameStore paths) that show the
   correct shape for this track, each with one line on *what* the file demonstrates.
3. **Outputs** — exact artifact paths they produce (`docs/pack/...`, `docs/slices/...`,
   code areas) and the template each artifact starts from.
4. **Pre-Slice Setup ritual** — the concrete per-slice checklist this persona runs
   before writing anything: ultra-think this slice from their track's angle, refresh
   best practices for exactly the surfaces this slice touches, list risks, then write.

## 4. Example stub (shape reference only)

```markdown
---
name: example-widget-expert
description: >-
  Load when a slice touches widget layout or the pack reaches the widget artifact —
  triggers: "widget spec", "widget section", "review widgets".
---

# example-widget-expert

| Field | Value |
|-------|-------|
| **Mission** | Own widget correctness end to end. |
| **Expert scope** | Widget code and widget spec sections. NOT data models, NOT deploy. |
| **Best-practice track** | Widget idioms for this stack; canonical: `libs/shared/ui/...`. |
| **Research step** | Every slice: re-check widget best practices for the exact widgets this slice touches before writing the Spec section, and again before Build. |
| **Pack work** | Reviews `slice-backlog.md` for widget boundaries (step 7). |
| **Slice Spec work** | Fills "Widgets" section: list, states, reuse plan. |
| **Slice Build work** | Implements widgets; verifies states render. |
| **Dev vs Prod** | Dev: preview states allowed. Prod: no debug widgets. |
| **DoD** | All spec'd widgets exist, states covered by a test, no one-off styles. |
| **Handoff** | qa-tester (test plan), brand-designer (visual QA). |

## Operating notes
…

## Canonical patterns
…

## Outputs
…

## Pre-Slice Setup ritual
…
```
