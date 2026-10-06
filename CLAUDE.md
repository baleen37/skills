<!-- Generated: 2026-02-01 | Updated: 2026-02-20 -->

# skills

## Purpose

skills - AI 코딩 어시스턴트 툴킷 (Claude Code, Codex)

AI 보조 개발을 위한 도구들을 제공하며, Git 워크플로우 보호, 개발 워크플로우 스킬(core, superpower),
외부 서비스 연동(atlassian, datadog), 자율 실험 루프(autoresearch) 등의 기능을 포함합니다.

## Key Files

| File | Description |
| ---- | ----------- |
| `package.json` | Project dependencies and scripts (commitizen, husky, semantic-release) |
| `.releaserc.js` | Semantic-release configuration synchronizing marketplace.json and all plugin versions |
| `CLAUDE.md` | Project guidance for AI coding agents (architecture, commands, guidelines) |
| `README.md` | Project overview and documentation |
| `.pre-commit-config.yaml` | Pre-commit hooks configuration (YAML, JSON, ShellCheck, markdownlint, commitlint) |
| `.commitlintrc.js` | Commitlint configuration for Conventional Commits |
| `.gitignore` | Git ignore patterns |

## Subdirectories

| Directory | Purpose |
| --------- | ------- |
| `plugins/` | Plugin sources, one subdirectory per plugin (`atlassian`, `autoresearch`, `core`, `datadog`, `superpower`, `wiki`); each holds `skills/`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` (`core` also has `agents/` and `hooks/`) |
| `scripts/` | Maintenance scripts (Codex artifact sync/check, marketplace version sync, agent CLI pin updates, dispatch, harness audit) |
| `.claude-plugin/` | Marketplace configuration (`marketplace.json`) listing all plugins |
| `.github/` | GitHub Actions workflows and custom actions |
| `tests/` | BATS test suites (entry point: `tests/run-all-tests.sh`) |
| `docs/` | Development and testing documentation, design specs and plans |
| `.claude/` | Claude Code session data |

## For AI Agents

### Agent Compatibility

- Claude Code and Codex compatibility is a required baseline. Preserve both when changing
  project guidance, plugin metadata, skills, hooks, or validation scripts.
- Treat this file as provider-neutral project guidance. It must remain usable by Claude Code,
  Codex, and future LLM coding agents.
- Keep durable project rules in this file. Keep provider-specific glue in thin adapter files only
  when a provider requires different filenames, tool names, or invocation syntax.
- Do not duplicate architecture, workflow, or command guidance across agent-specific files. Link
  or mirror only the minimum needed for compatibility.
- When adding new guidance, prefer capability-based wording such as "AI agents", "coding agents",
  or "LLM providers" unless the rule is truly specific to Claude Code or Codex.
- If a rule depends on a provider feature, include the generic intent first and the
  provider-specific mechanism second, so other providers can map it later.

### Working In This Directory

- Always run `bun install` after modifying package.json
- Use Conventional Commits format: `type(scope): description`
- Use `bun run commit` for interactive commit creation (works via Bun's npm compatibility)
- Never bypass pre-commit hooks with `--no-verify` (blocked by `plugins/core/hooks/commit-guard.sh`)
- Follow semantic-release workflow for version management

### Testing Requirements

- Run `bun run test` before committing (runs every BATS suite via `tests/run-all-tests.sh`)
- Ensure all pre-commit hooks pass: `pre-commit run --all-files`

### Common Patterns

- Multi-plugin marketplace: each plugin lives under `plugins/<name>/` with its own
  `.claude-plugin/plugin.json` (and `.codex-plugin/` for Codex). The root
  `.claude-plugin/marketplace.json` lists every plugin via its `source` path.
- Version synchronization: `.releaserc.js` updates `marketplace.json` and each
  `plugins/*/.claude-plugin/plugin.json` (all plugins share one version)
- Portable paths: Use `${CLAUDE_PLUGIN_ROOT}` in hook scripts
- Hook script requirements: `set -euo pipefail`, jq for JSON parsing, stderr for errors
- Skill scripts (under `plugins/*/skills/*/scripts/`) are written in **TypeScript** and run with
  `bun` — do NOT propose Python or shell alternatives for these scripts
- Do not write tests that assert `SKILL.md` content or frontmatter fields. Test executable
  scripts, generated artifacts, schemas, and packaging structure instead.

## Dependencies

### External

- **Bun** - Runtime environment and package manager (>= 1.0.0)
- **semantic-release** - Automated version management
- **commitizen/commitlint** - Conventional Commits enforcement
- **husky** - Git hooks management
- **pre-commit** - Pre-commit hooks framework (Python-based)
- **BATS** - Bash Automated Testing System

### Development Tools

- **jq** - JSON parsing in shell scripts
- **ShellCheck** - Shell script linting
- **markdownlint** - Markdown linting
- **YAML linting** - YAML validation

<!-- MANUAL: Project-specific notes below this line are preserved -->
