// OpenCode V2 plugin entrypoint.
//
// Install: `opencode plugin add skills@git+https://github.com/baleen37/skills.git`
// (or add that spec to the `plugins` list in ~/.config/opencode/opencode.json).
// Registers the core and wiki skills through OpenCode's native skill tool.
// Claude Code hooks and agents have no OpenCode equivalent and are not loaded.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const PLUGINS = ["core", "wiki"];

// Reads top-level `key: value` frontmatter lines, folding indented
// continuation lines (YAML `>`/`|` block scalars) into one line. Enough for
// name/description; not a YAML parser.
function parseSkill(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  let key = null;
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      key = m[1];
      meta[key] = /^[>|][+-]?$/.test(m[2]) ? "" : m[2].replace(/^(["'])(.*)\1$/, "$2");
    } else if (key && /^\s+\S/.test(line)) {
      meta[key] = `${meta[key]} ${line.trim()}`.trim();
    }
  }
  return { meta, body: match[2] };
}

export function loadSkills(base = root) {
  const skills = [];
  for (const plugin of PLUGINS) {
    const dir = path.join(base, "plugins", plugin, "skills");
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name, "SKILL.md");
      if (!entry.isDirectory() || !fs.existsSync(file)) continue;
      const { meta, body } = parseSkill(fs.readFileSync(file, "utf8"));
      skills.push({
        id: entry.name,
        name: meta.name || entry.name,
        ...(meta.description ? { description: meta.description } : {}),
        path: file,
        content: body,
      });
    }
  }
  return skills;
}

async function setup(ctx) {
  if (typeof ctx?.skill?.transform !== "function") return;
  const skills = loadSkills();
  await ctx.skill.transform((draft) => {
    // A throw escaping this callback disables the whole plugin, so skip
    // individual skills the host rejects.
    for (const skill of skills) {
      try {
        draft.add(skill);
      } catch (err) {
        console.error(`[baleen-skills] skill "${skill.id}" rejected:`, err);
      }
    }
  });
}

export default { id: "baleen-skills", setup };
