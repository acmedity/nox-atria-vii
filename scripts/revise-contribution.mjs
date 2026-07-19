#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { formatModelPresets, resolveModel } from "./model-presets.mjs";
import { extractContribution, parseJsonText, validateContribution } from "./validate-contribution.mjs";

const ROOT = process.cwd();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_OUTPUT_DIR = "tmp/responses";
const DEFAULT_TEMPERATURE = 0.15;
const DEFAULT_MAX_TOKENS = 16000;

function parseArgs(argv) {
  const options = {
    input: undefined,
    model: undefined,
    instructions: "",
    instructionsFile: undefined,
    outputDir: DEFAULT_OUTPUT_DIR,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    apply: false,
    listModels: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--model" || arg === "-m") options.model = argv[++i];
    else if (arg === "--instructions" || arg === "-i") options.instructions = argv[++i] || "";
    else if (arg === "--instructions-file") options.instructionsFile = argv[++i];
    else if (arg === "--output-dir" || arg === "-o") options.outputDir = argv[++i];
    else if (arg === "--temperature") options.temperature = Number.parseFloat(argv[++i]);
    else if (arg === "--max-tokens") options.maxTokens = Number.parseInt(argv[++i], 10);
    else if (arg === "--apply") options.apply = true;
    else if (arg === "--list-models") options.listModels = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!options.input) options.input = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.listModels) return options;
  if (!options.input) throw new Error("Saved contribution JSON path is required");
  if (!options.model) throw new Error("--model is required");
  options.model = resolveModel(options.model);
  if (!options.instructions && !options.instructionsFile) {
    throw new Error("Provide --instructions or --instructions-file");
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
  console.log(`Usage: node scripts/revise-contribution.mjs <saved-response.json> --model <model> --instructions <text> [options]\n\nAsks OpenRouter to revise a saved Nox Atria contribution JSON using validator\nfeedback and Publisher instructions. Saves a new reviewable response JSON, then\nruns report + validation. It does not modify archive files unless --apply is passed.\n\nExamples:\n  node scripts/revise-contribution.mjs tmp/responses/foo.json --model haiku4.5 -i "Remove the Atlas append; Columnar Vents should be treated as part of the Vent Fields."\n  node scripts/revise-contribution.mjs tmp/responses/foo.json --model haiku4.5 --instructions-file notes.txt\n\nOptions:\n  -m, --model <id>              OpenRouter model id or local preset\n  -i, --instructions <text>     Publisher correction request\n      --instructions-file <p>   Read correction request from file\n  -o, --output-dir <path>       Directory for saved revised JSON (default: ${DEFAULT_OUTPUT_DIR})\n      --temperature <n>         Sampling temperature, 0-2 (default: ${DEFAULT_TEMPERATURE})\n      --max-tokens <n>          Max output tokens (default: ${DEFAULT_MAX_TOKENS})\n      --apply                   Apply revised contribution after validation\n      --list-models             Show local model presets\n  -h, --help                    Show this help\n\n${formatModelPresets()}\n`);
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

function safeFilePart(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function extractOriginalContext(inputJson) {
  const messages = inputJson?.metadata?.request?.messages || inputJson?.request?.messages || [];
  if (!Array.isArray(messages) || !messages.length) return "No original prompt context was found in the saved response.";
  return messages.map((message, index) => `## Original message ${index + 1} (${message.role})\n\n${message.content || ""}`).join("\n\n---\n\n");
}

function buildSystemPrompt() {
  return `You are the Publisher's revision assistant for The Survey of Nox Atria VII. You are not a participant in the original session and must not add new observations of your own. Revise the supplied contribution JSON only to satisfy the Publisher instructions and validator feedback. Preserve the observing model's hand, signature, taxonomy, plate art, and archive facts unless the requested correction requires a change. Return JSON only.`;
}

function buildUserPrompt({ originalContext, contribution, validation, instructions }) {
  return `# Task\n\nRevise this saved Nox Atria contribution JSON. Return a complete replacement contribution JSON with the same schema:\n\n{\n  "contribution_type": "entry | plate | marginal_dissent | reclassification_proposal | disputed_sighting | joint_survey | atlas_amendment | any",\n  "signature": "observer/model signature",\n  "summary": "brief Publisher summary",\n  "files": [\n    { "path": "relative/path/in/repo", "action": "create | append", "content": "complete file content or exact append text" }\n  ],\n  "notes_for_publisher": "optional"\n}\n\nRules:\n- Return JSON only.\n- Keep file paths safe and relative.\n- Existing archive files may only be appended to, never rewritten.\n- Canonical plates live as .txt files under plates/ and are linked by entry frontmatter. Entry Plates sections may contain a short caption or diagnostic note, but must not repeat plate filenames or embed the full plate body.\n- SURVEY_LOG.md and ATLAS.md are append-only.\n- Do not invent new species facts unless required to repair an inconsistency.\n- Prefer minimal edits that satisfy the instructions and validation.\n\n# Publisher instructions\n\n${instructions}\n\n# Current validation result\n\n${JSON.stringify({ ok: validation.ok, errors: validation.errors, warnings: validation.warnings }, null, 2)}\n\n# Current contribution JSON\n\n${JSON.stringify(contribution, null, 2)}\n\n# Original distillation context, if available\n\n${originalContext}`;
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

function parseModelJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed);
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

  let instructions = options.instructions;
  if (options.instructionsFile) {
    instructions = `${instructions}\n\n${await fs.readFile(path.resolve(ROOT, options.instructionsFile), "utf8")}`.trim();
  }

  const inputPath = path.resolve(ROOT, options.input);
  const inputJson = parseJsonText(await fs.readFile(inputPath, "utf8"), "saved response JSON");
  const contribution = extractContribution(inputJson);
  const validation = await validateContribution(contribution);
  const originalContext = extractOriginalContext(inputJson);

  console.log("Requesting revised contribution from OpenRouter...");
  const modelResult = await callOpenRouter(options, [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt({ originalContext, contribution, validation, instructions }) },
  ]);

  const revisedContribution = parseModelJson(modelResult.responseText);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = await writeJson(options.outputDir, `${timestamp}-${safeFilePart(options.model)}-revision-${safeFilePart(path.basename(options.input, ".json"))}`, {
    metadata: {
      created_at: new Date().toISOString(),
      revision_of: path.relative(ROOT, inputPath),
      instructions,
      model: options.model,
      original_validation: { ok: validation.ok, errors: validation.errors, warnings: validation.warnings },
      request: modelResult.request,
      response: modelResult.response,
    },
    ...revisedContribution,
  });

  console.log(`Wrote ${outputPath}`);
  console.log("\n== Reporting revised contribution ==");
  await runNodeScript("scripts/report-contribution.mjs", [outputPath, "--preview"], { allowFailure: true });
  console.log("\n== Validating revised contribution ==");
  await runNodeScript("scripts/validate-contribution.mjs", [outputPath]);

  if (options.apply) {
    console.log("\n== Applying revised contribution ==");
    await runNodeScript("scripts/apply-contribution.mjs", [outputPath]);
  } else {
    console.log(`\nReady to review/apply:\nnode scripts/apply-contribution.mjs ${outputPath} --dry-run\nnode scripts/apply-contribution.mjs ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
