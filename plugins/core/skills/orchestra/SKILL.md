---
name: orchestra
description: Lead a team of OpenAI Codex CLI workers. You plan, delegate, verify, and steer; Codex writes the code, and your context stays small. Claude Code only. Use when the user asks to hand work to Codex or run in orchestra mode.
---

# Orchestra

Claude Code only. If you are Codex, ignore this skill and do not run it.

You are the team lead. Each Codex thread is a teammate. You split the work, write each task, verify the result, and send fixes back. Codex writes the code.

Your context is the scarce resource. The helper keeps every Codex event in files outside the repo and prints only a status line and a JSON result of at most 300 characters.

## Delegate

```bash
bun <this skill's directory>/scripts/orchestra.ts T1 <<'EOF'
<task>
EOF
```

- Run it with Bash `run_in_background` and wait for the completion notice, then read the task output. It is a few lines.
- Output: `T1 done thread=<id> model=gpt-6.2-sol effort=low time=95s tokens=100kin/1kout`, then `{"status","summary","files_touched","blockers"}`, then `git diff --stat` for the touched files and a ` new: <path>` line per file Codex created. Anything other than `done` also prints the errors and the last log lines, and exits 1.
- Codex runs with `gpt-6.2-sol`, full access (no sandbox, no approvals). Start from a clean `git status` so any change can be reverted. If the account rejects the model, the run fails at once: report it to the user, and do not retry or switch models. Pass `--model <name>` only when the user names a different model.
- Effort is `low` by default; it handles most well-specified tasks. Pass `--effort medium` for an unclear bug or a change across many files, or after a `low` run's work falls short. `--effort high` only after `medium` falls short. Errors that are not about the work (model rejected, timeout) are never fixed by more effort.
- Run teammates in parallel only when their tasks touch different files. Otherwise one at a time.

## Write the task

Codex sees none of this conversation. Each task needs:

1. Goal: the behavior you want, in one or two sentences.
2. Scope: files it may touch, and what to leave alone.
3. Done when: the command that proves it, plus the inputs that must work.

The helper appends the quality rules to every prompt (run the done-when command, add edge-case tests, stay in scope), so do not repeat them. Keep each task under about 25 minutes of work; the helper stops a worker at 30 minutes and reports it failed. Split anything bigger.

## Verify, then steer

The result is a claim, not proof.

1. Run the done-when command yourself.
2. `git diff --stat`, then `git diff -- <file> | head -200` for the files that matter. Look for inputs the tests do not cover.
3. If it falls short, message the same teammate by reusing its task id. The helper resumes that Codex thread:

```bash
bun <this skill's directory>/scripts/orchestra.ts T1 --effort medium <<'EOF'
This is Claude reviewing your change. <what is wrong, with evidence>
EOF
```

Raise the effort when it is the second fix for the same problem. Treat Codex as a colleague, not an authority: when you disagree, say why with evidence.

## Track and stop

- `bun <this skill's directory>/scripts/orchestra.ts status` prints the latest line per task. After `/compact` or a restart, run it first.
- A task fails twice: stop and tell the user what is still broken. Do not quietly do the task yourself.
- When done, report per task what changed and what you verified, then run `orchestra.ts clean`.
- Never read the raw `.jsonl` files in `$TMPDIR/orchestra/`. They hold every event and flood your context.
