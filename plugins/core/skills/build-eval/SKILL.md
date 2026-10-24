---
name: build-eval
description: Build a runnable eval set for one flow of an LLM-powered app. Use when the user wants to measure whether their LLM app works, asks "how do I know if my change helped", or is about to change a prompt, model, or tool and needs a baseline number.
---

An eval is three things: **inputs**, a way to **run the app** on each input, and a way to **grade** each output. The goal is a runnable eval the user trusts enough to make deploy decisions with, not a document about evals. Fit it into the repo's existing idiom; never impose a framework.

Run this as an interview. Every decision gets your recommendation first, so a user who trusts your defaults just says yes. Two sign-offs are literal pauses where you wait for an explicit yes: **the inputs** (Step 1) and **the grading method** (Step 2). The first paid full run is a third gate. Keep chat updates short: the number, the path to open, what you need them to look at.

Read [`TRUST-CHECKS.md`](TRUST-CHECKS.md) before Step 0. Every eval you build must pass it.

## Step 0: Pin down one flow

1. Ask what exactly to measure. One flow per eval; an app with six flows gets six evals, and you build the one they asked about.
2. Find the entry point (function, endpoint, script) that turns a user input into the output that matters. Read enough to know the model, provider, system prompt, tools, and output shape (text, JSON, tool trajectory, file).
3. Ask what one request carries besides text: files, user profile, memory, a conversation prefix, a workspace. That defines what an eval case holds. For multi-turn input, default to grading the conversation outcome, not each turn.
4. Note live external state (DB, search index, private docs). Prefer the real entry point; stub only tools with real side effects or unreproducible state.

Done when you can name the flow, the entry point, and what one case contains.

## Step 1: Source the inputs

1. Ask what already exists: test cases, a grader, a harness. Reuse what exists, build only what is missing, and say which is which before writing anything. For existing cases, ask where the expected outputs came from; gold copied from the model under comparison rewards imitation.
2. Source realistic inputs, first available wins:
   1. **Production logs.** First confirm retention and PII allow keeping them. If not: store only identifiers and fetch at run time, have the user anonymize, or rewrite into synthetic look-alikes the user reviews.
   2. **Bug reports and complaints.**
   3. **Hand-written by the user**: five to ten, treated as a seed.
   4. **Synthesized by you**: lowest fidelity. Anchor on three to five real examples plus one sentence on what makes a case hard; never synthesize cold.
3. Aim for 15 to 100 cases, with labeled positives and negatives where the task allows. If the user will hillclimb later, size against the improvement they hope to detect (see the noise floor in `TRUST-CHECKS.md`).
4. Write every input to a markdown file (table of `id`, `tags`, `expected`, then one fenced block per case) and point the user at it. Do not render case text into hand-written HTML; it is untrusted.

**Sign-off:** "Are these representative? Anything missing or irrelevant?" Fix every "mostly, but..." and show again. If several rounds were needed, restate the final set once and confirm.

## Step 2: Choose the grading

1. Offer side-channel metrics to log per case: output tokens, tool calls, refusals, truncation, format adherence, cost, latency. Ask which have a hard product ceiling.
2. Pick the cheapest grader that measures what matters:
   1. **Programmatic**: exact match, label, schema, tests pass. For agents that act on an environment, grade the **end state** in a disposable workspace (tests pass, diff applies, nothing off-limits touched) plus a no-op detector.
   2. **Pairwise blind judge**: best when the question is comparative (v1 vs v2, migration). Randomize A/B, allow `tie` / `both_bad`, treat candidates as untrusted data. Freeze the baseline outputs to disk once and compare every later variant against those.
   3. **Pointwise rubric judge**: for open-ended output with no baseline. Let the user pick the judge model, never the model under test. Use structured output for the verdict. Write criteria as checkable claims, not "rate helpfulness 1-5".
   4. **Human spot-check**: when no rubric is writable; say plainly it limits how often the eval runs.
3. For classification, report precision, recall, specificity, and false-positive rate as separate metrics, not accuracy alone.
4. Show your work on the rubric: criteria included, criteria left out and why. Generalize each to its principle. Prefer continuous measures over hard cutoffs for tradeoffs.
5. Pilot the grader on about five cases, written in the [`LAYOUT.md`](LAYOUT.md) shape under `baseline/`. Have the user read each case's full transcript next to its grade.

**Sign-off:** "Would you have scored any of these differently?" One yes means the rubric is not ready; iterate until their judgment and the grader agree, then get an explicit yes on the final version.

## Step 3: Make it runnable

1. Write the runner in the repo's language and idiom (CLI, pytest, script). It calls the **real entry point**, a test-account path through the real API, or a thin wrapper that mocks only side effects. Never rebuild the model call yourself.
2. Give it the properties in [`LAYOUT.md`](LAYOUT.md) § Runner: concurrent with a bound, rows appended as cases finish, resume keyed on `(case, rep)`, a per-case wall-clock ceiling, jittered backoff, a failure class on every failed attempt, and `model` read from the response.
3. Run one pilot case and read the row it wrote, not the printed number. Every field the report needs must be present and non-trivial; a zero cost or latency is a runner bug.
4. Run the oracle, null, and judge-trap checks from `TRUST-CHECKS.md`.
5. Tell the user what you are about to run: "N cases x R reps on `<model>`, about Z minutes", with Z scaled from the pilot's wall-clock. If they ask about cost, compute it from the pilot's measured `usage` and their provider's prices, and show the formula. Proceed on a yes.

## Step 4: Hand it over

1. Run the full baseline. Recompute the headline from `results.jsonl` rows yourself.
2. Write `summary.md` in the flow directory: headline metric with confidence interval, per-metric means, error count, and the trace path of every failing case.
3. Hand over the path plus one line ("baseline scores X on N cases"). Mention one or two cases only when the user should look at them first.
4. Ask whether to commit: the eval minus `traces/` (recommended, quote the file count and size), the eval plus traces, or nothing. Add `**/traces/` to `.gitignore` for the first option.
5. If they want to improve the score next, point them at the `hillclimb` skill.
