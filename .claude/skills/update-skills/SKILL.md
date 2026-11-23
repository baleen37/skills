---
name: update-skills
description: Compare core's adapted Matt Pocock skills against upstream mattpocock/skills and propose updates.
disable-model-invocation: true
---

`plugins/core` adapts skills from [mattpocock/skills](https://github.com/mattpocock/skills). Treat upstream as
the source and core as a fork pinned to a **snapshot**. Find what upstream changed since that snapshot, and
propose how to carry each change into core without losing core's **adaptations**.

## 1. Read the pin

From `plugins/core/upstream/README.md`, record:

- the snapshot SHA,
- the rename map and the skills core does not package (the "Local adaptations" section).

Done when you hold the SHA and the full map.

## 2. Fetch upstream

Clone fresh into a new temp directory; local plugin caches lag behind upstream.

```sh
UP=$(mktemp -d)/up && git clone -q --filter=blob:none https://github.com/mattpocock/skills "$UP"
git -C "$UP" log --oneline <snapshot>..HEAD
git -C "$UP" diff --stat <snapshot>..HEAD
```

If the log is empty, report "core is current at `<snapshot>`" and stop.

## 3. Map changed files to core

Upstream nests skills by category (`skills/<category>/<name>/`); core flattens them to
`plugins/core/skills/<name>/`, applying the rename map. Upstream's packaged set is the `skills` array in
`.claude-plugin/plugin.json`; compare it at the snapshot and at HEAD.

Sort every changed path into one bucket:

| Bucket | Meaning |
| --- | --- |
| **changed** | a skill core packages changed upstream |
| **added** | a skill entered upstream's packaged set |
| **removed** | a skill left upstream's packaged set, or was deleted |
| **ignored** | not packaged by core (`in-progress/`, `misc/`, repo tooling) — list once, no proposal |

Done when every path in the diff stat sits in exactly one bucket.

## 4. Three-way merge each changed file

For each **changed** file, the base is upstream at the snapshot, "ours" is core, "theirs" is upstream HEAD:

```sh
git -C "$UP" show <snapshot>:<upstream-path> > /tmp/base
git -C "$UP" show HEAD:<upstream-path> > /tmp/theirs
git merge-file -p plugins/core/skills/<name>/<file> /tmp/base /tmp/theirs > /tmp/merged
```

`command diff /tmp/base plugins/core/...` shows core's adaptation; `command diff /tmp/base /tmp/theirs` shows the
upstream change (`command` skips a shell alias such as `diff` → `difft`). Keep adaptations: `/skill` and
`"skill"` invocations rewritten to `core:skill`, renamed skills, and anything else the first diff shows. Resolve
each conflict marker by hand and say why.

## 5. Propose

Write the report in Korean and hand it to the user. Edit nothing yet.

1. One table row per upstream change: skill, what changed (one line), recommendation (**adopt** / **adapt** /
   **skip**), reason.
2. **Improvement points**: upstream ideas worth borrowing beyond a line-level sync — a new skill, a
   restructured section, a technique core lacks. Rank them; at most 5.
3. Conflicts and adaptations you would lose, quoted.

Done when every **changed**, **added**, and **removed** item has a recommendation.

## 6. Apply what the user approves

1. Write the merged files for approved items into `plugins/core/skills/`.
2. For an adopted new skill, add `agents/openai.yaml` beside `SKILL.md`, matching existing core skills.
3. Bump the snapshot SHA and date in `plugins/core/upstream/README.md` and
   `plugins/core/upstream/mattpocock-skills/README.md`; update the rename map if it changed.
4. Run `bun run test`.
5. Commit as `fix(core): sync Matt Pocock skills to upstream <sha>` (`feat(core)` when a skill is added).
