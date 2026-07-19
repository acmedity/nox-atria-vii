import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = path.resolve(__dirname, "../../../entries");
const PLATES_DIR = path.resolve(__dirname, "../../../plates");

const md = new MarkdownIt({ html: true, typographer: true });

const VALID_GENERA = new Set([
  "Lucifera", "Thermovora", "Lithophaga", "Praedator", "Saprovora",
]);

const VALID_STATUSES = new Set([
  "Abundant", "Irruptive", "Colonizing", "Vulnerable",
  "Critically Endangered", "Relict", "Extinct", "Data Deficient",
]);

const MANDATORY_SECTIONS = [
  "Description", "Status", "Habitat", "Energy & Trophic Role",
  "Plates", "Easily Confused With",
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitSections(body) {
  // Drop the leading H1 (the common name).
  body = body.replace(/^#\s+.+$/m, "").trim();
  const out = [];
  const parts = body.split(/^##\s+/m);
  // First chunk is pre-H2 content (after the H1 strip, usually empty).
  for (const part of parts.slice(1)) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim()
      .replace(/\s*\*?\(optional[^)]*\)\*?$/i, "")
      .trim();
    const content = (nl === -1 ? "" : part.slice(nl + 1)).trim();
    out.push({ heading, content, slug: slugify(heading) });
  }
  return out;
}

function stripFencedCodeBlocks(content) {
  return content.replace(/```[^\n]*\n[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizePlateName(plate) {
  return String(plate)
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^[./\\]*(?:plates[\\/])+/, "");
}

function normalizePlateList(plates) {
  if (!plates) return [];
  if (Array.isArray(plates)) return plates.map(normalizePlateName).filter(Boolean);
  return String(plates)
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(normalizePlateName)
    .filter(Boolean);
}

function loadPlateFiles(plates) {
  return normalizePlateList(plates).map((filename, index) => {
    const fullPath = path.join(PLATES_DIR, filename);
    let content = "";
    let missing = false;
    try {
      content = fs.readFileSync(fullPath, "utf8").trimEnd();
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      missing = true;
    }
    return {
      filename,
      index: index + 1,
      roman: ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][index] || String(index + 1),
      url: `/plates/${filename}`,
      content,
      missing,
    };
  });
}

function extractMarginalia(content) {
  // Each block is a fenced code block; the Marginalia section may have
  // freeform prose between blocks. We capture every fenced code block.
  const blocks = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const text = m[1].replace(/\s+$/, "");
    const reMatch = text.match(/\|\s*Re:\s*(.+?)\s*\|/);
    let target = null;
    if (reMatch) {
      const first = reMatch[1].split(",")[0].trim();
      target = slugify(first.replace(/\bsection\b/i, "").trim());
    }
    blocks.push({ text, target });
  }
  return blocks;
}

function canonicalStatus(status) {
  // Accept the canonical status optionally followed by a parenthetical
  // qualifier (e.g. "Abundant (with documented retreat...)" -> "Abundant").
  // Preserves Law III by not overwriting the source; just surfaces the
  // canonical token for filtering and the pill UI.
  const trimmed = String(status).trim();
  const head = trimmed.replace(/\s*\(.*\)\s*$/, "").trim();
  return VALID_STATUSES.has(head) ? head : null;
}

function validate(entry, filename) {
  const errs = [];
  for (const field of ["name", "binomial", "genus", "status", "first_observed", "observer"]) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
      errs.push(`missing frontmatter field: ${field}`);
    }
  }
  if (entry.genus && !VALID_GENERA.has(entry.genus)) {
    errs.push(`invalid genus "${entry.genus}" (Law VI)`);
  }
  if (entry.status && !entry.statusCanonical) {
    errs.push(`invalid status "${entry.status}" (Law VII)`);
  }
  const headings = new Set(entry.sections.map(s => s.heading));
  for (const required of MANDATORY_SECTIONS) {
    if (!headings.has(required)) {
      errs.push(`missing mandatory section: ${required} (Law V)`);
    }
  }
  if (errs.length) {
    throw new Error(`Entry ${filename} fails Survey laws:\n  - ${errs.join("\n  - ")}`);
  }
}

export default function () {
  const files = fs.readdirSync(ENTRIES_DIR)
    .filter(f => f.endsWith(".md") && !f.startsWith("_"))
    .sort();

  return files.map(f => {
    const fullPath = path.join(ENTRIES_DIR, f);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = matter(raw);
    const sections = splitSections(parsed.content);

    const marginaliaSection = sections.find(s => /^marginalia$/i.test(s.heading));
    const marginalia = marginaliaSection ? extractMarginalia(marginaliaSection.content) : [];
    const bodySections = sections
      .filter(s => !/^marginalia$/i.test(s.heading))
      .map(s => {
        const content = /^plates$/i.test(s.heading) ? stripFencedCodeBlocks(s.content) : s.content;
        return { ...s, content, html: content ? md.render(content) : "" };
      });

    const entry = {
      ...parsed.data,
      filename: f,
      sections: bodySections,
      plateFiles: loadPlateFiles(parsed.data.plates),
      marginalia,
      url: `/entries/${parsed.data.name}/`,
      statusCanonical: canonicalStatus(parsed.data.status),
      statusQualifier: (() => {
        const m = String(parsed.data.status ?? "").match(/\(([^)]+)\)/);
        return m ? m[1].trim() : null;
      })(),
      // Strip a trailing ", Month YYYY" from the observer when displaying,
      // since the first_observed date sits right next to it. Source is
      // preserved (Law III); the canonical signature remains in `observer`.
      displayObserver: String(parsed.data.observer ?? "")
        .replace(/,\s*\w+\s+\d{4}\s*$/, "")
        .trim(),
    };

    validate(entry, f);
    return entry;
  });
}
