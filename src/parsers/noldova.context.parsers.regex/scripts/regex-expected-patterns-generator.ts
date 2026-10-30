/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { API } from "typescript/unstable/sync";

import JsonObjectReader from "../../../../scripts/json-object.reader.ts";
import Script from "../../../../scripts/script.ts";
import RegexConformanceCase from "./regex-conformance-case.ts";
import RegexConformanceLayout from "./regex-conformance-layout.ts";
import RegexExpectedManifest from "./regex-expected-manifest.ts";
import type RegexExpectedRecord from "./regex-expected-record.ts";

export default class RegexExpectedPatternsGenerator extends Script {
  private static readonly READING_VERSION: number = 1;
  private static readonly CASES_DIRECTORY: string = RegexConformanceLayout.pathOf(RegexConformanceLayout.CASES);
  private static readonly EXPECTED_DIRECTORY: string = RegexConformanceLayout.pathOf(RegexConformanceLayout.EXPECTED);
  private static readonly PATTERNS_PATH: string = path.posix.join(RegexExpectedPatternsGenerator.EXPECTED_DIRECTORY, "patterns.jsonl");
  private static readonly MANIFEST_PATH: string = path.posix.join(RegexExpectedPatternsGenerator.EXPECTED_DIRECTORY, "MANIFEST.json");
  private static readonly PROJECT_DIRECTORY: string = "_build/regex-expected";
  private static readonly PROJECT_FILE_NAME: string = "tsconfig.json";
  private static readonly CASE_EXTENSION: string = ".js";
  private static readonly CASE_GLOB: string = "**/*.js";
  private static readonly HASH_ALGORITHM: string = "sha256";
  private static readonly HASH_ENCODING: "hex" = "hex";
  private static readonly LINE_FEED: string = "\n";
  private static readonly PROJECT_COMPILER_OPTIONS: Readonly<Record<string, unknown>> = {
    allowJs: true,
    module: "esnext",
    noEmit: true,
    noLib: true,
    target: "esnext",
    types: [],
  };
  private static readonly PROJECT_UNAVAILABLE: string = "The pinned TypeScript opened no project over the vendored cases.";
  private static readonly EXPECTED_MISSING: string = "The committed expected patterns are missing; generate them.";
  private static readonly EXPECTED_PIN_OUTDATED: string = "The committed expected patterns were generated under another TypeScript pin; regenerate them.";
  private static readonly EXPECTED_READING_OUTDATED: string = "The committed expected patterns were generated under another reading rule; regenerate them.";
  private static readonly EXPECTED_PATTERNS_ALTERED: string = "The committed expected patterns do not match their manifest; regenerate them rather than edit them.";

  public override async runAsync(): Promise<void> {
    const records = await this.readRecordsAsync();
    const patterns = RegexExpectedPatternsGenerator.serialize(records);
    await this.removeDirectoryAsync(RegexExpectedPatternsGenerator.EXPECTED_DIRECTORY);
    await this.createDirectoryAsync(RegexExpectedPatternsGenerator.EXPECTED_DIRECTORY);
    await this.writeFileAsync(RegexExpectedPatternsGenerator.PATTERNS_PATH, patterns);
    await this.writeFileAsync(RegexExpectedPatternsGenerator.MANIFEST_PATH, await this.createManifestAsync(records, patterns));
  }

  public async verifyAsync(): Promise<void> {
    if (!await this.pathExistsAsync(RegexExpectedPatternsGenerator.MANIFEST_PATH) || !await this.pathExistsAsync(RegexExpectedPatternsGenerator.PATTERNS_PATH))
      throw new Error(RegexExpectedPatternsGenerator.EXPECTED_MISSING);

    const manifest = JsonObjectReader.parse(await this.readFileAsync(RegexExpectedPatternsGenerator.MANIFEST_PATH), RegexExpectedPatternsGenerator.MANIFEST_PATH);
    if (manifest.string("typescriptVersion") !== await this.readTypeScriptVersionAsync())
      throw new Error(RegexExpectedPatternsGenerator.EXPECTED_PIN_OUTDATED);

    if (manifest.integer("readingVersion") !== RegexExpectedPatternsGenerator.READING_VERSION)
      throw new Error(RegexExpectedPatternsGenerator.EXPECTED_READING_OUTDATED);

    if (manifest.string("patternsSha256") !== RegexExpectedPatternsGenerator.hash(await this.readFileAsync(RegexExpectedPatternsGenerator.PATTERNS_PATH)))
      throw new Error(RegexExpectedPatternsGenerator.EXPECTED_PATTERNS_ALTERED);
  }

  private async readRecordsAsync(): Promise<readonly RegexExpectedRecord[]> {
    const casePaths = readdirSync(RegexExpectedPatternsGenerator.CASES_DIRECTORY, { recursive: true, withFileTypes: true })
      .filter(t => t.isFile() && t.name.endsWith(RegexExpectedPatternsGenerator.CASE_EXTENSION))
      .map(t => path.relative(RegexExpectedPatternsGenerator.CASES_DIRECTORY, path.join(t.parentPath, t.name)).split(path.sep).join(path.posix.sep))
      .sort();
    const projectPath = await this.writeProjectAsync();
    const api = new API({ cwd: path.dirname(projectPath) });
    try {
      const project = api.updateSnapshot({ openProjects: [projectPath] }).getProjects()[0];
      if (project === undefined)
        throw new Error(RegexExpectedPatternsGenerator.PROJECT_UNAVAILABLE);

      return casePaths.map(casePath => {
        const fileName = path.resolve(RegexExpectedPatternsGenerator.CASES_DIRECTORY, casePath);
        const sourceFile = project.program.getSourceFile(fileName);
        if (sourceFile === undefined)
          throw new Error(RegexExpectedPatternsGenerator.caseUnread(casePath));

        const sha256 = createHash(RegexExpectedPatternsGenerator.HASH_ALGORITHM).update(readFileSync(fileName)).digest(RegexExpectedPatternsGenerator.HASH_ENCODING);
        return new RegexConformanceCase(casePath, sha256, sourceFile, project.program.getSyntacticDiagnostics(fileName).length > 0).read();
      });
    }
    finally {
      api.close();
    }
  }

  private async writeProjectAsync(): Promise<string> {
    const projectDirectory = path.resolve(RegexExpectedPatternsGenerator.PROJECT_DIRECTORY);
    const casesDirectory = path.relative(projectDirectory, path.resolve(RegexExpectedPatternsGenerator.CASES_DIRECTORY)).split(path.sep).join(path.posix.sep);
    const projectPath = path.join(projectDirectory, RegexExpectedPatternsGenerator.PROJECT_FILE_NAME);
    await this.createDirectoryAsync(projectDirectory);
    await this.writeFileAsync(projectPath, JSON.stringify({
      compilerOptions: RegexExpectedPatternsGenerator.PROJECT_COMPILER_OPTIONS,
      include: [path.posix.join(casesDirectory, RegexExpectedPatternsGenerator.CASE_GLOB)],
    }));

    return projectPath;
  }

  private async createManifestAsync(records: readonly RegexExpectedRecord[], patterns: string): Promise<string> {
    return new RegexExpectedManifest(await this.readTypeScriptVersionAsync(), RegexExpectedPatternsGenerator.READING_VERSION, records,
      RegexExpectedPatternsGenerator.hash(patterns)).serialize();
  }

  private static hash(text: string): string {
    return createHash(RegexExpectedPatternsGenerator.HASH_ALGORITHM).update(text).digest(RegexExpectedPatternsGenerator.HASH_ENCODING);
  }

  private static serialize(records: readonly RegexExpectedRecord[]): string {
    return records.map(t => `${t.serialize()}${RegexExpectedPatternsGenerator.LINE_FEED}`).join("");
  }

  private static caseUnread(casePath: string): string {
    return `The pinned TypeScript did not read the vendored case ${casePath}.`;
  }
}
