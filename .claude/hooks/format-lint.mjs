// PostToolUse hook: runs Prettier (and ESLint for JS/TS) on files Claude writes or edits.
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(
  process.env.CLAUDE_PROJECT_DIR ??
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".."),
);

const LINTABLE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const FORMATTABLE = new Set([...LINTABLE, ".md"]);

let input = "";
for await (const chunk of process.stdin) input += chunk;

let filePath;
try {
  filePath = JSON.parse(input)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);

const absPath = path.resolve(projectDir, filePath);
const rel = path.relative(projectDir, absPath);
const ext = path.extname(absPath).toLowerCase();

if (
  rel.startsWith("..") ||
  path.isAbsolute(rel) ||
  !FORMATTABLE.has(ext) ||
  !fs.existsSync(absPath)
) {
  process.exit(0);
}

const run = (script, args) =>
  spawnSync(process.execPath, [path.join(projectDir, script), ...args], {
    cwd: projectDir,
    encoding: "utf8",
  });

// ESLint first (autofixes, incl. superfluous whitespace), Prettier last so the saved file is always formatted.
// --max-warnings 0 makes warnings reach Claude too, so it follows every linter recommendation.
const eslint = LINTABLE.has(ext)
  ? run("node_modules/eslint/bin/eslint.js", [
      "--fix",
      "--no-warn-ignored",
      "--max-warnings",
      "0",
      absPath,
    ])
  : null;

const prettier = run("node_modules/prettier/bin/prettier.cjs", [
  "--write",
  "--ignore-unknown",
  absPath,
]);
if (prettier.status !== 0) {
  process.stderr.write(
    `Prettier failed on ${rel}:\n${prettier.stderr || prettier.stdout}`,
  );
}

if (eslint && eslint.status !== 0) {
  process.stderr.write(
    `ESLint found problems in ${rel} that need fixing:\n${eslint.stdout}${eslint.stderr}`,
  );
  process.exit(2);
}

process.exit(0);
