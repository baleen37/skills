# Eval layout

The on-disk contract shared by `build-eval` and `hillclimb`. If the user already has a results layout that carries the same per-case data, keep theirs.

```
.evals/<flow>/
  state.json             # split ids, metrics, goal, harness paths (hillclimb)
  metrics.md             # what each metric means
  summary.md             # baseline handover (build-eval) / status table + narrative (hillclimb)
  baseline/
    results.jsonl        # one row per (case, rep)
    errors.jsonl         # one row per failed attempt
    traces/<id>_rep<k>.json
  v1/                    # hillclimb rounds; names are exactly baseline or v<N>
    change.md            # what changed and why; first line is the one-line summary
    change.patch         # diff against the user's real source paths
    results.jsonl  errors.jsonl  traces/
```

## `results.jsonl` row

```json
{ "prompt_id": "case_17", "rep": 0, "prompt": "...full text...",
  "tags": ["topic-a", "hard"],
  "status": "ok",
  "grade": {"pass": 1, "quality": 7.2},
  "explanation": {"quality": "Cites two sources."},
  "model": "<served model id from the response>",
  "usage": {"input_tokens": 1200, "output_tokens": 480},
  "judge_model": "...", "judge_usage": {...},
  "latency_s": 12.4, "tool_calls": 2 }
```

- `grade` is always a `{metric_id: number}` dict once there is more than one metric. List the headline metric first in `state.json.metrics`.
- `status` is `ok`, or `truncated` when the output hit the token limit. Truncated rows are counted and left out of means.
- `tags[0]` is the primary grouping key; the split is stratified on it.
- Cost is derived when reporting from `model` x `usage` (and judge), never stored as a hard-coded rate.

## `traces/<id>_rep<k>.json`

A JSON list of `{role, content, thinking?, name?}` turns, `role` in `system | user | assistant | tool_call | tool_result`. Transcript and grade come from the same model call. Write images and binaries to sidecar files and reference their paths; no inline base64.

## `errors.jsonl`

Attempts that never produced a scorable output (API error after retries, timeout, tool exception, grader crash, served-model mismatch). Fields: `prompt_id`, `rep`, `failure_class`, `retries`, and `model` / `usage` when the call completed. These rows never go in `results.jsonl`, so resume re-runs them and plumbing is not scored as model failure. Their usage still counts as spend.

## Runner

- Concurrent, bounded near the rate limit.
- Appends each row when its case finishes; resume skips exactly the `(case, rep)` keys already in `results.jsonl`.
- Hard per-case wall-clock ceiling, independent of stream activity; a timeout is a failure class, not a zero.
- Jittered backoff on rate-limit and overload errors, with retry count recorded.
- A case that passes only on retry scores as a fail unless the user decides otherwise; every attempt counts toward cost.
- Asserts the response's `model` matches the requested one; a silent substitution fails the attempt loudly.
- Flags: `--variant <baseline|vN>`, `--reps <R>`, `--model <id>` so a new round is one flag, not a refactor.
- Prints `k/N done` progress so a background run can be checked with one read.
