# mattpocock-skills plugin

This plugin packages the skills exposed by Matt Pocock's official plugin.

- Upstream: <https://github.com/mattpocock/skills>
- Snapshot: `4ae2317` (2026-10-31)
- The skill list matches upstream `.claude-plugin/plugin.json`, except
  `code-review`: bstack keeps `core:code-review`, and upstream references to
  `code-review` resolve to it.
- Skill files are preserved verbatim.
- Category directories are flattened to the bstack plugin layout.
