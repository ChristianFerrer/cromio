#!/usr/bin/env node
// scripts/update-status.mjs
// Regenerates the auto-managed sections of STATUS.md (last updated timestamp
// and recent commits) so it stays current with every commit.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const STATUS_PATH = resolve(ROOT, "STATUS.md");

if (!existsSync(STATUS_PATH)) {
  console.error("[status] STATUS.md not found, skipping update");
  process.exit(0);
}

const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();

const now = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
const branch = sh("git rev-parse --abbrev-ref HEAD");
const commits = sh(
  "git log --pretty=format:'- %h %s _(%ar)_' -n 15",
).replaceAll("'", "");

const original = readFileSync(STATUS_PATH, "utf8");

const replaceBlock = (text, name, body) => {
  const re = new RegExp(
    `<!-- AUTO:${name}:START -->[\\s\\S]*?<!-- AUTO:${name}:END -->`,
    "m",
  );
  const block = `<!-- AUTO:${name}:START -->\n${body}\n<!-- AUTO:${name}:END -->`;
  if (!re.test(text)) return text;
  return text.replace(re, block);
};

let next = original;
next = replaceBlock(next, "UPDATED", `_Last updated: **${now}** · branch \`${branch}\`_`);
next = replaceBlock(next, "COMMITS", commits);

if (next !== original) {
  writeFileSync(STATUS_PATH, next);
  console.log("[status] STATUS.md refreshed");
} else {
  console.log("[status] STATUS.md unchanged");
}
