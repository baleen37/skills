---
name: hillclimb
description: Iteratively improve an LLM-powered app against an existing eval with a train/test split. Use when the user says "hillclimb", wants to raise an eval score, tune a prompt or tool descriptions against an eval, or cut cost or latency while holding quality.
---

The loop is **analyze, apply, run, record**, repeated until the target plateaus or the budget runs out. What makes it work is discipline: read real transcripts, attribute each effect to one change, keep state on disk, and never tune on the cases you score. **The result is the test-split delta from baseline**; train improvement is process, not result.

Recommend a default with every question. The plan sign-off at the end of Step 2 is the minimum approval before the loop starts. Keep chat to one line per round.

The on-disk contract is [`../build-eval/LAYOUT.md`](../build-eval/LAYOUT.md); the must-pass checks are [`../build-eval/TRUST-CHECKS.md`](../build-eval/TRUST-CHECKS.md).

## Step 0: Confirm a trustworthy eval

1. Ask for the eval command and where it writes per-case results. Each case must carry full transcript, `model`, `usage`, and grade dict from the same call. No runnable eval means **stop** and run the `build-eval` skill first.
2. Ask how the runner handles retries; score strict per attempt.
3. Run it once, then run `TRUST-CHECKS.md` against it. Must pass before round 1: the noise floor fits inside the headroom and the smallest improvement the user would act on, the mechanism probe, the headline recomputed from rows, the grader spot-check, and the served model. Triage every zero-scoring baseline case as harness error or genuine verdict.
4. If the flow spawns subagents, confirm the knobs you will tune reach every one of them.

## Step 1: Goal and scope

1. Ask what to optimize, listing only metrics the eval records: raise the headline metric, cut cost holding quality, cut latency holding quality, or move to another model and recover quality. The target is what the analyzer chases; every other recorded metric becomes a **guardrail** that must not regress outside noise.
2. Ask what is in scope (system prompt, a skill or instruction file, tool descriptions, model and API parameters, harness code) and what is **off-limits**. Off-limits is a hard constraint.
3. Have the user name the harness paths (runner, grader, anything the eval command executes). Edits to these never happen unattended.
4. For an instruction file, confirm how it reaches the model in the eval: injected into the prompt, or through the app's real discovery path. They measure different things.
5. Record goal, scope, and harness paths in `state.json`.
6. If the goal is cost, read [`COST.md`](COST.md) now. It replaces this loop's lever order, adoption gates, and stopping rules; everything else here still applies.

## Step 2: Stopping condition and plan

1. Ask the cadence: **until plateau** (recommended; target moves less than delta for K >= 3 rounds, or a guardrail regresses), **one round at a time**, or **N rounds**. Delta must exceed the noise floor.
2. If the user asks about cost, price `(rounds + 1) x reps x cost per pass` from measured `usage`, and get a ceiling. Same case set every round; never silently subset to fit.
3. Present the plan and wait for a yes:
   - a scope table, "will change" vs "won't touch";
   - who applies changes: you by default, or the user approves each diff (recommend this for regulated or customer-facing copy);
   - one paragraph on approach, including a max round count.

## Step 3: State, split, baseline

1. Create `.evals/<flow>/` per `LAYOUT.md`, or keep the user's layout.
2. **Split** at random, stratified by `tags[0]`, never by baseline score. Train is what the analyzer reads; test is scored every round, never opened, and picks the winner. Under about 30 cases or with a cross-case metric, skip the split, score everything, lean on reps, and label results **directional**. Record the ids in `state.json` and never change them.
3. Agree reps with the user; with reps above one, report "k of R passed".
4. Run the unmodified app on the full set. Record an environment fingerprint (commit, lockfile hash, model id). Check train and test means agree within noise; if not, re-draw the split.
5. Before the first unattended round, show the exact runner command and ask the user to allow it. That allowlist entry is the security boundary of the loop, so keep it to that one command.

## Step 4: The loop

**Analyze.** If the next change is obvious, write `vN/change.md` yourself. Otherwise spawn **one fresh analyzer subagent** per round and give it: the exact train trace paths (never the `traces/` directory), the train rows of `results.jsonl`, the current artifact, scope and off-limits, the target and guardrails, and the noise floor. Ask it for **one** change (one hypothesis about why cases fail, possibly touching several places) as a diff, citing verbatim lines and trace paths, plus how many cases show the behavior and what they cost. You see scores only and never read transcripts yourself; that is the data-isolation guarantee.

Steer it to describe failure **behavior**, not paste failure content; to fix root causes rather than reword lines; and to name which cases it expects to regress when removing something. If the full fix would land inside the noise floor, skip the round and treat it as a stall (Step 4.5).

**Apply.** Wait for approval if the user chose per-round review. Run a **de-fluff pass**: cut platitudes and restated defaults. Edit the real files, save `vN/change.patch` against the user's source paths, and snapshot the changed artifact into `vN/`. A patch touching a harness path waits for the user.

**Run.** In the background, full set, same reps, as one shell command. Before the full pass: for a config lever, run one case and confirm the server accepts it; have the runner print resolved cases x reps x model and compare to the plan. When it exits, verify `results.jsonl` has N x R rows; if short, re-launch (resume is idempotent). A round whose error profile differs grossly from baseline is void, rerun it.

**Record.** Update `state.json`, including `best` by test score against the goal. Rewrite the status table at the top of `summary.md` (round, one-line change, test, train, guardrails with baseline ratios, cost per pass, cumulative spend) and a short paragraph on which variant leads and why. Report one line in chat: "v3 test 0.71 -> 0.74, change: <one line>". Every metric behind a recommendation must be on the rows and in the table, not only in a scratch script.

**Decide.**
- Train up, test flat: overfit, revert.
- Train down: revert before stacking anything.
- Train down, test up: noise at low reps; keep only if it repeats.
- A judge-graded jump bigger than the change explains is **suspicious** until you hand-check outputs.
- Track a leading indicator that the mechanism fired (tool called, file written); a score that moved without it is probably noise.
- Check the stopping condition. Approaching the budget with the score still climbing: offer to extend. Target plateaued: offer to retarget a guardrail with headroom, but ask first.

## Step 4.5: Categorize before grinding

After two or three rounds that fail to clear the noise band, spend one round on categorization. Have a fresh analyzer bucket every remaining train failure:

| Bucket | Tell | Instead of another content round |
|---|---|---|
| Artifact gap | Model lacked the fact; guesses | Keep looping |
| Grader disagreement | Output looks right, grader says wrong | Fix grader, re-grade every variant from stored outputs; if the ranking flips, propose restarting from baseline |
| Harness / infra | Error, timeout, empty output scored as zero | Fix harness; exclude from denominator |
| Structural | Content exists but is not reached | Reorganize, consolidate, fix routing |
| Variance | Same-code flips as large as the deltas | Report best so far; offer more reps |

Write the counts into `vN/change.md`. If many independent dimensions each cost one or two cases, one **breadth pass** covering all of them at once is allowed.

## Step 5: Report

1. Leave the codebase at the version that won on test.
2. Headline: baseline test score -> winner test score, each with a CI. If the delta is within noise, say so plainly and recommend not merging.
3. Per-round table with train and test side by side; grey out deltas inside noise.
4. Each applied change with its one-line why, tagged **`[REQUIRED]`** (fixes something broken) or **`[TUNE]`** (a judgment call the user may decline).
5. Two or three before/after transcript pairs on the targeted behavior, a failure taxonomy when zeros have mixed causes, a re-run on any other model the artifact serves, and the concrete levers still untried.
6. Offer to commit the eval and flow directory if they are not committed yet.
