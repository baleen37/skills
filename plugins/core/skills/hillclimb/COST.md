# Cost hillclimb

The loop variant for when the Step 1 goal is **cost at equal-or-better quality**, often during a model migration. Same split, state, and analyzer rules as `SKILL.md`; this file changes the lever order, the adoption gates, and the stopping rules. Every number here is a shape to expect, not a promise; re-measure on the user's eval.

## Lever order

Work the levers in this order. Each runs before the next because running it later corrupts or wastes the steps in between.

### 0. Caching health: check first, re-check after every lever change

Caching is configuration, not a lever, but it gates every cost reading. Check: breakpoints or prefix caching are set, the cached prefix holds no dynamic content (timestamps, ids, unsorted JSON), and cache-read tokens are nonzero in `usage`. Caches are usually per model, and on some providers reasoning-effort settings are part of the cache key, so a model or effort change can silently turn a healthy cache into a cost regression that looks like model behavior.

### 1. Audit the prompt and request config

Dated prompt content and legacy request parameters distort every later comparison. Newer models follow old scaffolding more literally, so a model swap judged under a dated prompt can mis-rank models and even add cost. Check request parameters against the provider's current API (deprecated fields can be rejected or silently inflate cost). The audit runs once and is cheap.

### 2. Model x effort: walk the staircase, not the grid

The cheapest passing configuration is often a **stronger model at lower effort**, because it spends fewer tokens on the same task. Fixing the model and tuning effort never finds it; a full grid finds it by paying for the expensive corner.

Lay out rows as model tiers (strongest on top) and columns as effort or thinking level (low to high). Within a row cost rises with effort; at fixed effort, quality rises with tier. Quality along effort is only weakly monotone, so the walk never relies on it.

**Round-0 diagnostic.** From the baseline repeats already run for the noise floor, read output-token share and turns per case; spend one or two cheap cells on the old model at another effort to see effort sensitivity. Output-heavy, multi-turn, effort-sensitive: expect the winner near the top rows' low cells. Input-heavy, single-shot, effort-flat: per-token price dominates; expect to step down quickly. The diagnostic decides where repeats are spent, never where the walk enters.

**Cost-plausibility screen.** Project each tier's low cell from its token prices times an effort-matched token profile. Drop a tier only when no projection within a 2-3x error band brings it under the next tier's medium cell. When in doubt, keep it: inclusion errors are cheap, exclusion errors are silent.

**The walk.** Enter at the highest cost-plausible tier at low effort.

- **Pass** at (tier, effort): it becomes the incumbent with cost `c*`. Drop the rest of the row (everything to the right costs more) and step **down** a tier, only into cells projected under `c*`.
- **Fail**: assume lower tiers at that effort also fail and step **right**. Once an incumbent exists, only into cells under `c*`, at most one or two notches.
- **Overlap probe**: after fail-then-pass on a tier, cells of the tier below projected under `c*` may still be probed. This is the walk's only branch.
- **Extension**: if the whole top row fails and its passing cells price near a frontier tier above the grid, probe that tier's low cell once.
- **Stop** when no unprobed cell projects under `c*`. The incumbent is the answer.
- If the entire top row fails the floor, the eval sits at the models' capability frontier: the upgrade is a quality story, not a cost story. Say so and stop.

**Rules the walk needs.**

1. Pre-register the quality floor before round 1 (for example the baseline's best repeat), never the baseline mean read afterwards.
2. A cell whose margin over the floor is inside the noise floor gets a second run before it becomes the incumbent. A lucky false pass prunes the true winner.
3. A fail inside the noise floor gets re-tested before the walk steps right.
4. Pruning is deferral, not deletion. Re-admit a cell if projections recalibrate; early projections often run about 2x optimistic.
5. Single-run reads are pass/fail evidence, not rankings. Telemetry (reasoning tokens, output tokens, tool rounds) is the honest single-run signal.
6. If a step right does not change reasoning tokens, the effort dial is dead for that model family: treat the row as exhausted.
7. Walk cells run cache-cold; annotate readings, and keep effort fixed within any session you cost.
8. Optionally run one declared **quality-reference cell** (top tier, high effort) outside the walk, so the ceiling is known.

Already on a current model with a tuned prompt? Sweeping effort downward is fine, but always add the one next-tier-up-at-low probe; adjacent tiers' cost bands overlap.

### 3. Prompt hillclimb on the frozen model

Prompt wins rarely transfer across models, so climb only after the model is frozen. Do not assume the prompt is where the cost lives: per-run cost is often bound by turn count and context growth, not prompt text. Pre-register a falsifier before a cleanup round ("if the cleaned prompt does not come in under $X, the prompt lever is exhausted") so a no-win closes the lever.

### 4. Re-probe one cell down-left

A cleaned prompt can rescue a cheaper cell that failed under the old prompt. Probe one notch lower or one tier lower. One cell, not a reopened search.

### 5. Joint confirm

Re-sample effort around the chosen point at n >= 3, on held-out cases, as the pre-registered confirm of the full (model, prompt, effort) configuration against the gates below. **The confirm's number is the headline**, not the selection rounds'.

### 6. Multi-model topologies: usually never

One strong model at the right effort has beaten team shapes on the cost-quality plane; cheap tokens pay by *substitution*, not by *addition*. Consider a topology only when the executor must be cheap or a different provider, or the task has a checkable artifact a cheap verifier can read. Its bar is the Step 2 frontier.

## Adoption gates

Register before round 1 and write them into the plan sign-off. A change is adopted only if all three pass:

1. **Quality band**: held-out score within a named band of the incumbent.
2. **Cost margin**: cheaper beyond a registered margin, at the stated pricing basis.
3. **Mechanism**: the predicted mechanism shows up in measurement ("removes duplicate lookups" means fewer tool calls, not just a lower bill). A tie with the right mechanism and a win with the wrong one are both rejections.

## Measurement discipline

- **Pricing basis**: lock it up front (price sheet, cache-adjusted or not, discounts). Cache reads typically bill around a tenth of fresh input, so accountings diverge fast. Do paper arithmetic with the rate card first; it can rule out configurations with zero runs.
- **Cost in the objective**: a quality-only climb can raise cost substantially. The gates are the objective.
- **One lever per round**, everything else frozen.
- **Predict before measuring**: each proposal states a point estimate and an 80% interval for score and cost, plus a falsifier. Compare after the round and recalibrate.
- **Routers** only price on the full traffic distribution, never on a hard subset.

## Where prompt cost lives

- **Cost scales with actions triggered, not prompt length.** One extra tool round can cost a third of a case; inert cached text is nearly free.
- **Count engagement before trimming.** Count in transcripts the artifacts each instruction demands (plan files, repeated reads, per-edit test runs), minus the prompt's own mentions. Near-zero means the model ignores it: deleting it will not save money.
- **Action-triggering instructions are the expensive ones**: "verify twice" and "be maximally thorough" add redundant lookups and tool calls. Audit those before trimming words.
- **Charge each standing directive its own token mass** at the cache-adjusted price; it must net positive.
- **Brevity caps save money through shorter replies**: a quality tradeoff to surface, with the median reply-length change.
- **Output tokens are also the latency lever.**

## Stopping rules

- **Prompt rounds**: wins usually land in rounds 1-2; stop after two consecutive variants fail to beat the incumbent beyond noise; cap at 3-4 rounds per model.
- **Effort**: savings shrink each step down while variance grows; stop inside the noise floor. Failures move between runs at low effort, so decide on aggregate non-inferiority over several runs, never per case.
- **The walk** stops itself; do not keep probing to be sure.
- **Overall**: ship when the joint confirm passes its gates; when it fails, report the best gated configuration honestly rather than re-searching on confirm data.
