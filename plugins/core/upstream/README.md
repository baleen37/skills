# Upstream provenance

`core` adapts the following MIT-licensed skill snapshot. Its original package
README and metadata are kept here as historical records, not installation
instructions. Upstream URLs and license notices remain unchanged.

| Source | Snapshot | Preserved notices |
| --- | --- | --- |
| [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317) | `4ae2317` (2026-10-31) | [README](mattpocock-skills/README.md), [metadata](mattpocock-skills/metadata.json), [MIT license](mattpocock-skills/LICENSE) |

## Local adaptations

All distributed skills live in `../skills/` and use the `core:` namespace.
Upstream `/skill` invocations are rewritten to `core:skill`.

Matt's `implement-spec` flow skill is not packaged. Renamed skills:

- `ask-matt` → `ask` (routes only to skills packaged in `core`)
- `setup-matt-pocock-skills` → `setup`

- `teach` → `learn` (workspace under `~/.skills/learn/<topic>/`)
- `pr` → a `create-pr` reference
  (with [Humanlayer credits](../skills/create-pr/references/CREDITS.md))
- upstream `code-review` is not packaged; references resolve to the local `core:code-review`

obra/superpowers skills are not part of `core`; they ship as the separate
[`superpower`](../../superpower/README.md) plugin.
