import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const evaluationDir = join(projectRoot, "assets", "samples", "screenshots", "user-evaluation");
const entries = await readdir(evaluationDir, { withFileTypes: true });
const imageNames = entries
  .filter((entry) => entry.isFile() && /\.(?:jpe?g|png)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();

if (process.env.ECHO_RELEASE_BUILD === "1" && imageNames.length > 0) {
  const sourceRoot = join(projectRoot, "src");
  const sourceEntries = await readdir(sourceRoot, { recursive: true, withFileTypes: true });
  const references = [];
  for (const entry of sourceEntries) {
    if (!entry.isFile() || !/\.(?:[cm]?[jt]sx?|json)$/i.test(entry.name)) continue;
    const sourcePath = join(entry.parentPath, entry.name);
    const source = await readFile(sourcePath, "utf8");
    if (source.includes("assets/samples/screenshots/user-evaluation")) {
      references.push(sourcePath.slice(projectRoot.length + 1));
    }
  }

  if (references.length > 0) {
    console.error(`Release blocked: evaluation assets are referenced by ${references.join(", ")}.`);
    process.exit(1);
  }

  console.log(
    `Release asset check passed (${imageNames.length} local evaluation images are not referenced by app source).`,
  );
  process.exit(0);
}

const isDatalessMacFile = async (path) => {
  if (process.platform !== "darwin") return false;
  try {
    const { stdout } = await execFileAsync("stat", ["-f", "%Sf", path], { timeout: 2_000 });
    return stdout.includes("dataless");
  } catch {
    return false;
  }
};

let skippedCount = 0;

for (const imageName of imageNames) {
  const imagePath = join(evaluationDir, imageName);
  if (await isDatalessMacFile(imagePath)) {
    skippedCount += 1;
    console.warn(`Skipped unavailable File Provider placeholder: ${imageName}`);
    continue;
  }
  const bytes = await readFile(imagePath);
  const metadataText = bytes.toString("latin1");
  if (/(?:19|20)\d{2}:\d{2}:\d{2}|Screenshot|Apple iPhone|iPhone\d/i.test(metadataText)) {
    console.error(`Evaluation asset still contains identifying metadata: ${imageName}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(
    `Evaluation asset check passed (${imageNames.length - skippedCount} scanned, ${skippedCount} unavailable local-only images).`,
  );
}
