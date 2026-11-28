#!/usr/bin/env bats

load ../helpers/bats_helper

SCRIPT="${BATS_TEST_DIRNAME}/../../plugins/core/skills/orchestra/scripts/orchestra.ts"

setup() {
    ensure_jq
    export TMPDIR="$BATS_TEST_TMPDIR/tmp"
    export FAKE_ARGS="$BATS_TEST_TMPDIR/args"
    export FAKE_PROMPT="$BATS_TEST_TMPDIR/prompt"
    export FAKE_MODE=ok
    mkdir -p "$TMPDIR" "$BATS_TEST_TMPDIR/bin" "$BATS_TEST_TMPDIR/repo"
    git -C "$BATS_TEST_TMPDIR/repo" init -q
    cd "$BATS_TEST_TMPDIR/repo"

    cat > "$BATS_TEST_TMPDIR/bin/codex" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$FAKE_ARGS"
cat > "$FAKE_PROMPT"
out=""
while [ $# -gt 0 ]; do
    [ "$1" = "-o" ] && out="$2"
    shift
done
if [ "$FAKE_MODE" = reject ]; then
    echo '{"type":"thread.started","thread_id":"th-bad"}'
    echo '{"type":"error","message":"The gpt-6.2-sol model is not supported"}'
    exit 1
fi
if [ "$FAKE_MODE" = hang ]; then
    sleep 5
fi
if [ "$FAKE_MODE" = lie ]; then
    echo '{"type":"thread.started","thread_id":"th-1"}'
    echo '{"type":"turn.completed","usage":{}}'
    printf '{"status":"done","summary":"did it","files_touched":[],"blockers":[]}' > "$out"
    exit 1
fi
if [ "$FAKE_MODE" = fail ]; then
    echo '{"type":"error","message":"model not found"}'
    echo '{"type":"turn.failed","error":{"message":"model not found"}}'
    echo "fatal: boom" >&2
    exit 1
fi
grep -q ' resume ' "$FAKE_ARGS" || echo '{"type":"thread.started","thread_id":"th-1"}'
echo '{"type":"turn.completed","usage":{"input_tokens":120000,"output_tokens":800}}'
printf '{"status":"done","summary":"did it","files_touched":["a.ts"],"blockers":[]}' > "$out"
EOF
    chmod +x "$BATS_TEST_TMPDIR/bin/codex"
    work() { echo "$TMPDIR"/orchestra/repo-*; }
    export PATH="$BATS_TEST_TMPDIR/bin:$PATH"
}

@test "orchestra: new task prints status line and result, records thread" {
    run bun "$SCRIPT" T1 <<< "fix it"

    [ "$status" -eq 0 ]
    [[ "${lines[0]}" == "T1 done thread=th-1 model=gpt-6.2-sol effort=low time="*"s tokens=120kin/1kout" ]]
    [ "$(echo "${lines[1]}" | jq -r .summary)" = "did it" ]
    [ "$(cat "$(work)/T1.thread")" = "th-1" ]
    grep -q -- "-m gpt-6.2-sol -c model_reasoning_effort=low --json --dangerously-bypass-approvals-and-sandbox" "$FAKE_ARGS"
    grep -q "run the done-when command" "$FAKE_PROMPT"
}

@test "orchestra: reusing a task id resumes its thread with the given effort" {
    bun "$SCRIPT" T1 <<< "fix it"
    run bun "$SCRIPT" T1 --effort medium <<< "also this"

    [ "$status" -eq 0 ]
    grep -q "^exec resume th-1 -m gpt-6.2-sol -c model_reasoning_effort=medium" "$FAKE_ARGS"
    [[ "${lines[0]}" == "T1 done thread=th-1 model=gpt-6.2-sol effort=medium "* ]]
}

@test "orchestra: failure exits 1 with errors and log tail, no stale result" {
    bun "$SCRIPT" T1 <<< "fix it"
    FAKE_MODE=fail run bun "$SCRIPT" T1 <<< "again"

    [ "$status" -eq 1 ]
    [[ "${lines[0]}" == "T1 failed thread=th-1"* ]]
    [ "$(grep -c "error: model not found" <<< "$output")" -eq 1 ]
    [[ "$output" == *"fatal: boom"* ]]
    [[ "$output" != *"did it"* ]]
}

@test "orchestra: status shows the latest line per task, clean removes the work dir" {
    bun "$SCRIPT" T1 <<< "fix it"
    bun "$SCRIPT" T2 <<< "other"
    bun "$SCRIPT" T1 <<< "again"

    run bun "$SCRIPT" status
    [ "$status" -eq 0 ]
    [ "${#lines[@]}" -eq 2 ]

    [ -d "$(work)" ]
    bun "$SCRIPT" clean
    [ ! -e "$(work)" ]
}

@test "orchestra: rejects an empty prompt" {
    run bun "$SCRIPT" T1 < /dev/null
    [ "$status" -eq 2 ]
    [[ "$output" == *"prompt is empty"* ]]
}

@test "orchestra: lists files the worker created, which diff --stat skips" {
    echo 'x' > a.ts
    run bun "$SCRIPT" T1 <<< "fix it"

    [ "$status" -eq 0 ]
    [[ "$output" == *" new: a.ts"* ]]
}

@test "orchestra: a failed run is never reported done, even if the result says done" {
    FAKE_MODE=lie run bun "$SCRIPT" T1 <<< "fix it"

    [ "$status" -eq 1 ]
    [[ "${lines[0]}" == "T1 failed "* ]]
}

@test "orchestra: a hung worker times out and is reported failed" {
    FAKE_MODE=hang ORCHESTRA_TIMEOUT_MS=500 run bun "$SCRIPT" T1 <<< "fix it"

    [ "$status" -eq 1 ]
    [[ "${lines[0]}" == "T1 failed "* ]]
    [[ "$output" == *"ETIMEDOUT"* ]]
}

@test "orchestra: a rejected model fails at once and records no thread for a new task" {
    FAKE_MODE=reject run bun "$SCRIPT" T1 <<< "fix it"

    [ "$status" -eq 1 ]
    [[ "${lines[0]}" == "T1 failed thread=th-bad model=gpt-6.2-sol "* ]]
    [[ "$output" == *"error: The gpt-6.2-sol model is not supported"* ]]
    [ ! -e "$(work)/T1.thread" ]
}

@test "orchestra: a failed run keeps the teammate's working thread" {
    bun "$SCRIPT" T1 <<< "fix it"
    FAKE_MODE=reject run bun "$SCRIPT" T1 <<< "again"

    [ "$status" -eq 1 ]
    [ "$(cat "$(work)/T1.thread")" = "th-1" ]
}
