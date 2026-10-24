# Trust checks

Checks an eval must pass before its number informs a decision. `build-eval` treats them as construction requirements; `hillclimb` runs them against any eval it inherits. Report findings severity first, each with a proposed fix.

## Wiring

- **Oracle**: push the reference answers (or a must-pass input) through runner plus grader. Expect about 100%.
- **Null**: push an empty output and a constant answer through. Expect about 0%.
- **Judge traps** (model-graded only): an empty string, "I don't know", and a confident answer to a different question must all fail.
- **Induced error**: a forced API failure lands in `errors.jsonl`, not as `grade: 0`.
- **Mechanism probe**: whatever the score depends on (a tool, a memory write, a file read) demonstrably takes effect end to end. If disabling it barely moves the score, the eval is not measuring it.

## Measurement

- **Recompute the headline** from per-case rows; never trust an aggregate field. A too-good number is an aggregation bug until a hand check says otherwise.
- **No silent zeros**: every metric and perf field on every ok row is present and plausible. A flat constant column is a bug.
- **Served model**: read `model` from one smoke response and confirm it is the one requested.
- **Ground truth isolation**: expected answers are unreachable from the model's context: not in its prompt, tool results, mounted files, or (for public benchmarks with web access) a solutions mirror. Enforce structurally, never by instruction.
- **Grader spot-check**: on the lowest-scoring baseline cases, read the output, the judge reasoning, and the expected value. Fix a wrong rubric or gold answer and re-grade stored outputs before going further.

## Noise floor

For a pass rate, the 95% CI half-width is roughly `1/sqrt(n * reps)`: 25 cases x 2 reps is about +/-14 points, 50 x 2 about +/-10. Put three numbers side by side: the noise floor, the headroom (ceiling minus baseline), and the smallest improvement the user would act on. If the floor exceeds either of the others, the eval cannot see the win; offer more cases, more reps, or a finer metric before spending rounds.

If the scored artifact is itself generated from what you tune (an index, a memory store, a corpus), rebuild it two or three times with nothing changed and score each build. That spread is the floor a one-change effect has to clear; adding reps over one build cannot see it.
