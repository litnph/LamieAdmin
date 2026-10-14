import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const sourceRoot = path.resolve("src");
const facadePath = path.resolve("src/shared/icons/lucideAnimated.tsx");

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(target);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
    }),
  );
  return nested.flat();
};

test("all application Lucide imports go through the static facade", async () => {
  const files = await collectSourceFiles(sourceRoot);
  const directImports: string[] = [];

  await Promise.all(
    files.map(async (file) => {
      if (path.resolve(file) === facadePath) return;
      const content = await readFile(file, "utf8");
      if (/from\s+['"]lucide-react['"]/.test(content)) {
        directImports.push(path.relative(sourceRoot, file));
      }
    }),
  );

  assert.deepEqual(directImports.sort(), []);
});

test("the shared facade is static and sidebar animation keeps its safeguards", async () => {
  const facade = await readFile(facadePath, "utf8");
  const sidebarAnimatedIcon = await readFile(
    path.resolve("src/shared/components/AnimatedLucideIcon.tsx"),
    "utf8",
  );

  assert.match(facade, /export \* from ['"]lucide-react['"]/);
  assert.doesNotMatch(facade, /motion\/react|motion-source/);
  assert.match(sidebarAnimatedIcon, /prefers-reduced-motion:\s*reduce/);
  assert.match(sidebarAnimatedIcon, /sidebarMotionEnabled/);
  assert.match(sidebarAnimatedIcon, /data-lucide-animated/);
  assert.match(sidebarAnimatedIcon, /pointerenter/);
  assert.match(sidebarAnimatedIcon, /focusin/);
  assert.match(sidebarAnimatedIcon, /visibilitychange/);
  assert.match(sidebarAnimatedIcon, /stopAnimation/);
});
