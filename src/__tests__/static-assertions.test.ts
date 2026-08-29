// @vitest-environment node
//
// Static-assertion tests for tooling and dependency guarantees.
//
// These tests read project files directly from disk (Node `fs`) and assert
// invariants about the repository itself rather than runtime behavior:
//   - Requirement 9.1: no `react-dnd` / `react-dnd-html5-backend` dependencies
//   - Requirement 9.2: no `react-dnd` imports anywhere under `src/`
//   - Requirement 2.9: every dev dependency is pinned to an exact version
//   - Requirement 2.10: config files contain no hardcoded secrets
//
// A Node test environment is required because these assertions use the file
// system; there is no DOM involved.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Resolve the workspace root relative to this test file:
// this file lives at `<root>/src/__tests__/static-assertions.test.ts`.
const THIS_FILE = fileURLToPath(import.meta.url);
const __dirname = dirname(THIS_FILE);
const ROOT = resolve(__dirname, "..", "..");
const SRC_DIR = join(ROOT, "src");

const DND_PACKAGES = ["react-dnd", "react-dnd-html5-backend"] as const;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function readPackageJson(): PackageJson {
  const raw = readFileSync(join(ROOT, "package.json"), "utf8");
  return JSON.parse(raw) as PackageJson;
}

/** Recursively collect all `.ts`/`.tsx` files under a directory. */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      // Skip generated / vendored directories defensively.
      if (entry === "node_modules" || entry === "dist") continue;
      results.push(...collectSourceFiles(fullPath));
    } else if (stats.isFile()) {
      const ext = extname(fullPath);
      if (ext === ".ts" || ext === ".tsx") {
        results.push(fullPath);
      }
    }
  }
  return results;
}

describe("Dependency reconciliation (Requirement 9.1)", () => {
  const pkg = readPackageJson();
  const sections: Array<[string, Record<string, string> | undefined]> = [
    ["dependencies", pkg.dependencies],
    ["devDependencies", pkg.devDependencies],
    ["peerDependencies", pkg.peerDependencies],
  ];

  for (const dndPackage of DND_PACKAGES) {
    it(`does not declare "${dndPackage}" in any dependency section`, () => {
      for (const [sectionName, section] of sections) {
        expect(
          section ?? {},
          `"${dndPackage}" must not appear in ${sectionName}`,
        ).not.toHaveProperty(dndPackage);
      }
    });
  }
});

describe("No react-dnd imports in source (Requirement 9.2)", () => {
  const sourceFiles = collectSourceFiles(SRC_DIR);
  // Matches `from "react-dnd"`, `from 'react-dnd-html5-backend'`,
  // `require("react-dnd")`, and dynamic `import("react-dnd")` forms.
  const importPattern =
    /(?:from|import|require)\s*\(?\s*["'](react-dnd(?:-html5-backend)?)["']/;

  it("finds at least one source file to scan", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("contains no imports of react-dnd or react-dnd-html5-backend", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      // Skip this test file itself: it necessarily references the package
      // names it is asserting against and would otherwise match its own scan.
      if (resolve(file) === resolve(THIS_FILE)) continue;
      const contents = readFileSync(file, "utf8");
      if (importPattern.test(contents)) {
        offenders.push(file);
      }
    }
    expect(offenders, `Unexpected react-dnd imports in: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("Dev dependencies are pinned to exact versions (Requirement 2.9)", () => {
  const pkg = readPackageJson();
  const devDependencies = pkg.devDependencies ?? {};

  it("declares at least one dev dependency", () => {
    expect(Object.keys(devDependencies).length).toBeGreaterThan(0);
  });

  it("pins every dev dependency to an exact version (no ^ or ~)", () => {
    const exactVersion = /^\d+\.\d+\.\d+/;
    const unpinned = Object.entries(devDependencies).filter(
      ([, version]) => !exactVersion.test(version),
    );
    expect(
      unpinned,
      `These dev dependencies are not pinned to an exact version: ${unpinned
        .map(([name, version]) => `${name}@${version}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

describe("Config files contain no hardcoded secrets (Requirement 2.10)", () => {
  const configFiles = [
    "tsconfig.json",
    "tsconfig.node.json",
    "eslint.config.js",
    ".prettierrc.json",
    "vite.config.ts",
    "vitest.config.ts",
    "package.json",
  ];

  // Assignment of a quoted value to a secret-like key, e.g.
  //   apiKey: "abc123"   |   password = 'hunter2'   |   "token": "xyz"
  const secretAssignment =
    /(api[_-]?key|secret|password|passwd|token|credential|private[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i;
  // Common private-key PEM headers.
  const privateKeyHeader = /-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----/;

  for (const relativePath of configFiles) {
    it(`"${relativePath}" contains no secret-like assignments`, () => {
      let contents: string;
      try {
        contents = readFileSync(join(ROOT, relativePath), "utf8");
      } catch {
        // A missing optional config file is not a secret violation.
        return;
      }
      expect(
        secretAssignment.test(contents),
        `"${relativePath}" appears to contain a hardcoded secret assignment`,
      ).toBe(false);
      expect(
        privateKeyHeader.test(contents),
        `"${relativePath}" appears to contain a private key`,
      ).toBe(false);
    });
  }
});
