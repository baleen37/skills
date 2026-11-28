import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const USAGE = `usage:
  bun orchestra.ts <task-id> [--effort low|medium|high|xhigh] [--model M] < prompt
  bun orchestra.ts status
  bun orchestra.ts clean`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["status", "summary", "files_touched", "blockers"],
  properties: {
    status: { type: "string", enum: ["done", "partial", "failed"] },
    summary: { type: "string", maxLength: 300 },
    files_touched: { type: "array", items: { type: "string" } },
    blockers: { type: "array", items: { type: "string" } },
  },
};

// Appended to every prompt so quality rules cost the orchestrator no context.
const FOOTER = `

Before you finish:
- Stay inside the stated scope. A read-only task edits nothing.
- If you changed code: run the done-when command yourself, fix any failure, and add tests for edge cases you handle beyond the given examples.
- summary: what changed and how you verified it, under 300 characters.`;

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

function workDir(): string {
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  const root = top.status === 0 ? top.stdout.trim() : process.cwd();
  // The path hash keeps two repos with the same name apart.
  const hash = createHash("sha1").update(root).digest("hex").slice(0, 8);
  const dir = join(process.env.TMPDIR || tmpdir(), "orchestra", `${basename(root)}-${hash}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function readFrom(path: string, offset: number): string {
  if (!existsSync(path)) return "";
  return readFileSync(path).subarray(offset).toString("utf8");
}

function sizeOf(path: string): number {
  return existsSync(path) ? statSync(path).size : 0;
}

function events(jsonl: string): Array<Record<string, any>> {
  return jsonl
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function status(dir: string): void {
  const ledger = join(dir, "state.md");
  if (!existsSync(ledger)) return console.log("no tasks");
  const latest = new Map<string, string>();
  for (const line of readFileSync(ledger, "utf8").split("\n").filter(Boolean)) {
    latest.set(line.split(" | ")[0], line);
  }
  console.log([...latest.values()].join("\n"));
}

const args = process.argv.slice(2);
const id = args[0];
if (!id) fail(USAGE);

const dir = workDir();
if (id === "status") {
  status(dir);
  process.exit(0);
}
if (id === "clean") {
  rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}
if (!/^[A-Za-z0-9_-]+$/.test(id)) fail(`invalid task id: ${id}\n${USAGE}`);

const TIMEOUT_MS = Number(process.env.ORCHESTRA_TIMEOUT_MS) || 30 * 60 * 1000;
let effort = "low";
let model = "gpt-6.2-sol";
for (let i = 1; i < args.length; i += 2) {
  if (args[i] === "--effort" && args[i + 1]) effort = args[i + 1];
  else if (args[i] === "--model" && args[i + 1]) model = args[i + 1];
  else fail(USAGE);
}

const prompt = readFileSync(0, "utf8").trim();
if (!prompt) fail("prompt is empty: pass it on stdin");

const schema = join(dir, `${id}.schema.json`); // per task, so parallel runs never rewrite one another's
const result = join(dir, `${id}.json`);
const jsonl = join(dir, `${id}.jsonl`);
const log = join(dir, `${id}.log`);
const threadFile = join(dir, `${id}.thread`);
writeFileSync(schema, JSON.stringify(SCHEMA));
rmSync(result, { force: true }); // never report a stale result from an earlier run

// Same task id means the same teammate: continue its thread.
const thread = existsSync(threadFile) ? readFileSync(threadFile, "utf8").trim() : "";
const codexArgs = [
  "exec",
  ...(thread ? ["resume", thread] : []),
  "-m", model,
  "-c", `model_reasoning_effort=${effort}`,
  "--json",
  "--dangerously-bypass-approvals-and-sandbox",
  "--output-schema", schema,
  "-o", result,
  "-",
];

const startedAt = Date.now();
const jsonlStart = sizeOf(jsonl);
const logStart = sizeOf(log);
const out = openSync(jsonl, "a");
const err = openSync(log, "a");
const run = spawnSync("codex", codexArgs, {
  input: prompt + FOOTER,
  stdio: ["pipe", out, err],
  timeout: TIMEOUT_MS, // a hung worker must still end with a recorded failure
});
closeSync(out);
closeSync(err);

const newEvents = events(readFrom(jsonl, jsonlStart));
const usage = newEvents.filter((e) => e.type === "turn.completed").at(-1)?.usage;
const completed = usage !== undefined;
const started = newEvents.find((e) => e.type === "thread.started")?.thread_id;
// Keep a thread only once it has completed a turn, so a run that dies at startup
// (e.g. a rejected model) never replaces the teammate's working thread.
if (started && completed) writeFileSync(threadFile, started);
const threadId = started || thread || "-";
const errors = [
  ...new Set(
    newEvents
      .filter((e) => e.type === "turn.failed" || e.type === "error")
      .map((e) => e.error?.message || e.message || e.type),
  ),
];
const logTail = readFrom(log, logStart).trim().split("\n").slice(-20).join("\n");

let parsed: Record<string, any> | undefined;
if (sizeOf(result) > 0) {
  try {
    parsed = JSON.parse(readFileSync(result, "utf8"));
  } catch {}
}

const ok = run.status === 0 && completed && errors.length === 0 && parsed?.status === "done";
// A failed run never reports "done", whatever Codex wrote in its result.
const state = ok ? "done" : parsed?.status === "partial" ? "partial" : "failed";
const summary = (parsed?.summary || errors[0] || run.error?.message || "no result").replace(/\s+/g, " ");
appendFileSync(join(dir, "state.md"), `${id} | ${threadId} | ${state} | ${summary}\n`);

const kilo = (n?: number) => `${Math.round((n ?? 0) / 1000)}k`;
const secs = Math.round((Date.now() - startedAt) / 1000);
console.log(
  `${id} ${state} thread=${threadId} model=${model} effort=${effort} time=${secs}s ` +
    `tokens=${kilo(usage?.input_tokens)}in/${kilo(usage?.output_tokens)}out`,
);
if (parsed) console.log(JSON.stringify(parsed));
// The diff stat for the touched files saves the lead a separate call.
if (parsed?.files_touched?.length) {
  const git = (...a: string[]) => spawnSync("git", [...a, "--", ...parsed!.files_touched], { encoding: "utf8" });
  const stat = git("diff", "--stat");
  if (stat.status === 0 && stat.stdout.trim()) console.log(stat.stdout.trimEnd());
  // diff --stat skips files Codex created, so list those separately.
  const created = git("ls-files", "--others", "--exclude-standard");
  if (created.status === 0) for (const f of created.stdout.trim().split("\n").filter(Boolean)) console.log(` new: ${f}`);
}
if (!ok) {
  for (const message of errors) console.log(`error: ${message}`);
  if (logTail) console.log(logTail);
  if (run.error) console.log(`spawn: ${run.error.message}`);
}
process.exit(ok ? 0 : 1);
