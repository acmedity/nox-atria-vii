#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { formatModelPresets, resolveModel } from "./model-presets.mjs";
import { parseJsonText } from "./validate-contribution.mjs";

const ROOT = process.cwd();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OUTPUT_DIR = "tmp/responses";
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 16000;

const MONTHS = new Map([
  ["Jan", "January"], ["Feb", "February"], ["Mar", "March"], ["Apr", "April"],
  ["May", "May"], ["Jun", "June"], ["Jul", "July"], ["Aug", "August"],
  ["Sep", "September"], ["Oct", "October"], ["Nov", "November"], ["Dec", "December"],
]);

function parseArgs(argv) {
  const options = {
    input: undefined,
    model: undefined,
    mode: "auto",
    session: undefined,
    outputDir: DEFAULT_OUTPUT_DIR,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    minutesOnly: false,
    apply: false,
    listModels: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--model" || arg === "-m") options.model = argv[++i];
    else if (arg === "--mode") options.mode = argv[++i];
    else if (arg === "--session") options.session = normalizeSession(argv[++i]);
    else if (arg === "--output-dir" || arg === "-o") options.outputDir = argv[++i];
    else if (arg === "--temperature") options.temperature = Number.parseFloat(argv[++i]);
    else if (arg === "--max-tokens") options.maxTokens = Number.parseInt(argv[++i], 10);
    else if (arg === "--minutes-only") options.minutesOnly = true;
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--list-models") options.listModels = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!options.input) options.input = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.listModels) return options;
  if (!options.input) throw new Error("Backrooms export path is required");
  if (!options.model && !options.minutesOnly) throw new Error("--model is required unless --minutes-only is used");
  if (options.model) options.model = resolveModel(options.model);
  if (!["auto", "solo", "joint"].includes(options.mode)) {
    throw new Error("--mode must be auto, solo, or joint");
  }
  if (!Number.isFinite(options.temperature) || options.temperature < 0 || options.temperature > 2) {
    throw new Error("--temperature must be a number between 0 and 2");
  }
  if (!Number.isInteger(options.maxTokens) || options.maxTokens < 1) {
    throw new Error("--max-tokens must be a positive integer");
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/distill-backrooms.mjs <session-folder|conversation_full.html|file-url> --model <openrouter-model-or-preset> [options]\n\nConverts a lexical_backrooms Nox Atria solo or meeting session into reviewable\nrepo file operations, then reports/validates them. It never modifies archive\nfiles unless --apply is passed.\n\nExamples:\n  node scripts/distill-backrooms.mjs /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_20260628_181420 --model haiku4.5 --mode solo\n  node scripts/distill-backrooms.mjs /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_20260628_181420/conversation_full.html --model haiku4.5 --mode joint\n  node scripts/distill-backrooms.mjs file:///Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_20260628_181420/conversation_full.html --minutes-only\n  node scripts/distill-backrooms.mjs /Users/taylor/Documents/LiminalBackrooms/nox-atria-vii/session_20260628_181420 --model haiku4.5 --apply\n\nOptions:\n  -m, --model <id>          OpenRouter model id or local preset\n      --mode <mode>         auto | solo | joint (default: auto)\n      --session <NNNN>      Entry/session number (default: next unused entry number)\n  -o, --output-dir <path>   Directory for saved contribution JSON (default: ${DEFAULT_OUTPUT_DIR})\n      --temperature <n>     Sampling temperature, 0-2 (default: ${DEFAULT_TEMPERATURE})\n      --max-tokens <n>      Max output tokens (default: ${DEFAULT_MAX_TOKENS})\n      --minutes-only        Only write a Markdown transcript to tmp/\n      --apply               Apply generated contribution after validation\n      --list-models         Show local model presets\n  -h, --help                Show this help\n\n${formatModelPresets()}\n`);
}

function normalizeSession(value) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 1) throw new Error("--session must be a positive integer");
  return String(n).padStart(4, "0");
}

async function nextEntryNumber() {
  const files = await fs.readdir(path.join(ROOT, "entries"));
  const nums = files
    .map((name) => name.match(/^(\d{4})-/)?.[1])
    .filter(Boolean)
    .map((n) => Number.parseInt(n, 10));
  return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
}

async function loadDotEnv(filePath = ".env") {
  try {
    const text = await fs.readFile(path.join(ROOT, filePath), "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) continue;
      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function stripTags(text) {
  return text.replace(/<[^>]+>/g, "");
}

function decodeHtml(text) {
  const named = new Map([["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", '"'], ["apos", "'"], ["nbsp", " "]]);
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return named.get(entity) ?? `&${entity};`;
  });
}

function htmlContentToMarkdown(content) {
  let text = content;
  text = text.replace(/<pre(?:\s+[^>]*)?>([\s\S]*?)<\/pre>/gi, (_, inner) => `\n\n${decodeHtml(stripTags(inner)).trimEnd()}\n\n`);
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p\s*>/gi, "\n\n");
  text = text.replace(/<code(?:\s+[^>]*)?>([\s\S]*?)<\/code>/gi, "`$1`");
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*");
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**");
  text = stripTags(text);
  text = decodeHtml(text);
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractMessagesFromHtml(html) {
  const blocks = [...html.matchAll(/<div class="message ([^"]+)">\s*<div class="message-content">\s*<div class="header">([\s\S]*?)<\/div>\s*<div class="content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)];
  if (!blocks.length) throw new Error("No message blocks found in HTML export");

  return blocks.map((match) => {
    const classes = match[1];
    const header = match[2];
    const role = classes.includes("user") ? "user" : classes.includes("system") ? "system" : "assistant";
    const speaker = decodeHtml(stripTags(header.match(/<span class="ai-name [^"]+">([\s\S]*?)<\/span>/)?.[1] ?? (role === "user" ? "Human User" : "AI")));
    const model = decodeHtml(stripTags(header.match(/<span class="model-name">\(([\s\S]*?)\)<\/span>/)?.[1] ?? ""));
    const timestamp = decodeHtml(stripTags(header.match(/<span class="timestamp">([\s\S]*?)<\/span>/)?.[1] ?? ""));
    return { role, speaker, model, timestamp, content: htmlContentToMarkdown(match[3]) };
  }).filter((message) => message.content);
}

function extractMessagesFromBackroomsJson(data) {
  const messages = Array.isArray(data.main_conversation) ? data.main_conversation : [];
  if (!messages.length) throw new Error("No main_conversation messages found in Backrooms JSON");
  return messages
    .filter((message) => message?.content && message._type !== "agent_notification")
    .map((message) => ({
      role: message.role || "assistant",
      speaker: message.ai_name || message._user_name || (message.role === "user" ? "Human User" : "AI"),
      model: message.model || "",
      timestamp: message.timestamp || "",
      content: String(message.content || "").trim(),
    }));
}

async function resolveExportPath(inputPath) {
  const rawPath = String(inputPath || "");
  const localPath = rawPath.startsWith("file://") ? fileURLToPath(rawPath) : rawPath;
  const absolute = path.resolve(ROOT, localPath);
  const stat = await fs.stat(absolute);

  if (!stat.isDirectory()) return absolute;

  const candidates = ["conversation_full.html", "conversation.html", "index.html"];
  for (const candidate of candidates) {
    const candidatePath = path.join(absolute, candidate);
    try {
      const candidateStat = await fs.stat(candidatePath);
      if (candidateStat.isFile()) return candidatePath;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  throw new Error(`Session folder does not contain ${candidates.join(", ")}: ${absolute}`);
}

async function loadExport(inputPath) {
  const absolute = await resolveExportPath(inputPath);
  const text = await fs.readFile(absolute, "utf8");
  if (absolute.endsWith(".json")) {
    const data = parseJsonText(text, "Backrooms JSON export");
    return { sourcePath: absolute, sourceKind: "json", scenario: data.scenario || "", timestamp: data.timestamp || "", sessionTimestamp: data.session_timestamp || "", messages: extractMessagesFromBackroomsJson(data) };
  }
  return { sourcePath: absolute, sourceKind: "html", scenario: "Nox Atria VII", timestamp: "", sessionTimestamp: absolute.match(/session_(\d{8}_\d{6})/)?.[1] || "", messages: extractMessagesFromHtml(text) };
}

function dateFromTimestamp(timestamp) {
  const iso = String(timestamp || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00Z`);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  const human = String(timestamp || "").match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})/);
  if (human) return `${MONTHS.get(human[1]) ?? human[1]} ${Number(human[2])}, ${human[3]}`;
  return "undated";
}

function slugify(value) {
  return String(value || "backrooms")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "backrooms";
}

function safeFilePart(value) {
  return slugify(value).slice(0, 80) || "unknown";
}

function inferMode(requestedMode, messages) {
  if (requestedMode !== "auto") return requestedMode;
  const assistantSpeakers = new Set(messages.filter((m) => m.role === "assistant").map((m) => m.speaker).filter(Boolean));
  return assistantSpeakers.size > 1 ? "joint" : "solo";
}

function buildTranscriptMarkdown({ sourcePath, exportData, session, date, mode }) {
  const relSource = path.relative(ROOT, path.resolve(ROOT, sourcePath));
  const participants = [];
  const seen = new Set();
  for (const message of exportData.messages) {
    const key = `${message.speaker}|${message.model}`;
    if (seen.has(key)) continue;
    seen.add(key);
    participants.push(`- ${message.speaker}${message.model ? `: \`${message.model}\`` : ""}`);
  }

  const out = [];
  out.push(`# Backrooms Nox Atria Transcript`);
  out.push("");
  out.push(`- Session: ${session}`);
  out.push(`- Date: ${date}`);
  out.push(`- Mode: ${mode}`);
  out.push(`- Scenario: ${exportData.scenario || "unknown"}`);
  out.push(`- Source export: \`${relSource}\``);
  out.push("- Runtime: `lexical_backrooms`");
  out.push("");
  out.push("## Participants");
  out.push("");
  out.push(...participants);
  out.push("");
  out.push("## Transcript");
  out.push("");

  for (const message of exportData.messages) {
    out.push(`${message.speaker || message.role}`);
    if (message.model) out.push(`(${message.model})`);
    if (message.timestamp) out.push(message.timestamp);
    out.push(message.content);
    out.push("");
  }

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

async function readIfExists(relativePath) {
  try {
    return await fs.readFile(path.join(ROOT, relativePath), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

async function buildArchiveContext() {
  const parts = [];
  for (const file of ["README.md", "STYLE_BIBLE.md", "ATLAS.md", "PROTOCOL.md", "MEETINGS.md", "entries/_TEMPLATE.md", "SURVEY_LOG.md", "entries/0001-greater-hallwright.md"]) {
    const text = await readIfExists(file);
    if (!text) continue;
    parts.push(`## ${file}\n\n\`\`\`markdown\n${text.trimEnd()}\n\`\`\``);
  }
  return parts.join("\n\n");
}

function buildSystemPrompt() {
  return `You are the Publisher's Backrooms import assistant for The Survey of Nox Atria VII. You are not a participant in the session and you do not get to add new observations of your own. Your job is editorial: convert the supplied lexical_backrooms transcript into repository-ready file operations.\n\nFollow the archive's deadpan natural-history register. Preserve the observing model's hand and signature. Split entries, canonical plate .txt files, meeting minutes, Atlas appendices, and SURVEY_LOG appends into the correct files. Return JSON only.`;
}

function buildUserPrompt({ mode, session, date, archiveContext, transcriptMarkdown }) {
  const contributionType = mode === "joint" ? "joint_survey" : "entry";
  const modeRules = {
    solo: `Canonical solo import: distill the transcript into one complete entry, any canonical plate .txt files referenced by that entry, and one SURVEY_LOG.md append. Do not create meeting minutes for a solo session.`,
    joint: `Canonical joint import: create one meetings/minutes/${session}-<slug>.md file containing the supplied transcript, one complete entry, any canonical plate .txt files referenced by that entry, and one SURVEY_LOG.md append.`,
  }[mode];

  return `# Task\n\nConvert this Backrooms Nox Atria session into repo-ready file operations. Use entry/session number ${session}. Use first_observed/date ${date} unless the transcript gives a more specific canonical date. Mode: ${mode}.\n\n${modeRules}\n\nReturn exactly this JSON shape:\n\n{\n  "contribution_type": "${contributionType}",\n  "signature": "observer/model signature from the transcript, or a joint signature for meetings",\n  "summary": "brief Publisher summary",\n  "files": [\n    {\n      "path": "relative/path/in/repo",\n      "action": "create | append",\n      "content": "complete file content for create, or exact appended text for append"\n    }\n  ],\n  "notes_for_publisher": "optional concerns, uncertainties, or validation notes"\n}\n\nImportant rules:\n- Return JSON only. Multiline strings must be valid JSON strings.\n- For canonical entries, create entries/${session}-<lowercase-hyphenated-headword>.md.\n- Entry frontmatter must use: name, binomial, genus, status, first_observed, observer, biome, plates.\n- Mandatory sections: Description, Status, Habitat, Energy & Trophic Role, Plates, Easily Confused With, Marginalia.\n- Canonical plate files live at plates/{entry-slug}_{type}.txt and must be referenced in frontmatter and in the Plates section. Do not duplicate the full plate body in the entry; the website renders plate text from the canonical file. Recognized types: habitus, detail, biome, track, comparative.\n- Preserve good Backrooms plate art when present; do not redraw it just to make it prettier. Add only minimal missing labels/key/bias if needed for compliance.\n- If the transcript introduced a new place not in ATLAS.md, include an append operation to ATLAS.md.\n- SURVEY_LOG.md appends must begin with a blank line, then --- and a ## Session ${session} heading; include Date, Naturalist/Observer, Contribution, Occupied territory, and Note to successor.\n- Marginalia append content must be ASCII only.\n- Existing published files may only be appended to, never rewritten.\n\n# Archive context\n\n${archiveContext}\n\n# Backrooms transcript\n\n${transcriptMarkdown}`;
}

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

async function callOpenRouter(options, messages) {
  await loadDotEnv();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set. Add it to .env or your shell environment.");

  const body = {
    model: options.model,
    messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
    response_format: { type: "json_object" },
  };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://github.com/",
      "X-Title": process.env.OPENROUTER_APP_NAME || "nox-atria-vii",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    responseJson = { non_json_response_body: responseText };
  }
  if (!response.ok) throw new Error(`OpenRouter request failed with HTTP ${response.status}: ${responseText.slice(0, 500)}`);

  const content = responseJson?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter response did not include message content");
  return { request: body, response: responseJson, responseText: content };
}

async function writeJson(outputDir, basename, data) {
  const dir = path.resolve(ROOT, outputDir);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${basename}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return path.relative(ROOT, filePath);
}

function runNodeScript(scriptPath, args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { cwd: ROOT, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { const text = chunk.toString(); stdout += text; process.stdout.write(text); });
    child.stderr.on("data", (chunk) => { const text = chunk.toString(); stderr += text; process.stderr.write(text); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || allowFailure) resolve({ code, stdout, stderr });
      else reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.listModels) {
    console.log(formatModelPresets());
    return;
  }

  const session = options.session ?? await nextEntryNumber();
  const exportData = await loadExport(options.input);
  const mode = inferMode(options.mode, exportData.messages);
  const date = dateFromTimestamp(exportData.timestamp || exportData.messages.find((m) => m.timestamp)?.timestamp);
  const transcriptMarkdown = buildTranscriptMarkdown({ sourcePath: exportData.sourcePath, exportData, session, date, mode });

  if (options.minutesOnly) {
    const outPath = path.join(ROOT, "tmp", `${session}-${safeFilePart(mode)}-backrooms-transcript.md`);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, transcriptMarkdown, "utf8");
    console.log(`Wrote ${path.relative(ROOT, outPath)}`);
    return;
  }

  const archiveContext = await buildArchiveContext();
  console.log("Requesting Backrooms distillation from OpenRouter...");
  const modelResult = await callOpenRouter(options, [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt({ mode, session, date, archiveContext, transcriptMarkdown }) },
  ]);

  const contribution = parseModelJson(modelResult.responseText);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = await writeJson(options.outputDir, `${timestamp}-${safeFilePart(options.model)}-backrooms-${session}-${mode}`, {
    metadata: {
      created_at: new Date().toISOString(),
      source: path.relative(ROOT, exportData.sourcePath),
      source_kind: exportData.sourceKind,
      session,
      mode,
      model: options.model,
      request: modelResult.request,
      response: modelResult.response,
    },
    ...contribution,
  });

  console.log(`Wrote ${outputPath}`);
  console.log("\n== Reporting contribution ==");
  await runNodeScript("scripts/report-contribution.mjs", [outputPath, "--preview"], { allowFailure: true });
  console.log("\n== Validating contribution ==");
  await runNodeScript("scripts/validate-contribution.mjs", [outputPath]);

  if (options.apply) {
    console.log("\n== Applying contribution ==");
    await runNodeScript("scripts/apply-contribution.mjs", [outputPath]);
  } else {
    console.log(`\nReady to review/apply:\nnode scripts/apply-contribution.mjs ${outputPath} --dry-run\nnode scripts/apply-contribution.mjs ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
