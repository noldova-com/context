/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { Assert, CoverageAnalyzer, CoverageProject, TestClass, TestData, TestingException, TestMethod } from "@noldova/context.testing";

@TestClass
export class FileCoverageAnalyzerTests {
  @TestMethod
  @TestData("null")
  @TestData("[]")
  @TestData("42")
  @TestData("{}")
  @TestData('{"version":"3","sources":["sample.ts"],"mappings":"AAAA"}')
  @TestData('{"version":3,"mappings":"AAAA"}')
  @TestData('{"version":3,"sources":"sample.ts","mappings":"AAAA"}')
  @TestData('{"version":3,"sources":[null],"mappings":"AAAA"}')
  @TestData('{"version":3,"sources":[42],"mappings":"AAAA"}')
  @TestData('{"version":3,"sources":["sample.ts"]}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":42}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","sourceRoot":null}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","sourceRoot":42}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":42}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":"name"}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":null}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":[null]}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":[42]}')
  public async rejectsMalformedSourceMapShapesAtTheFileBoundaryAsync(sourceMapText: string): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-map-shape-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      await writeFile(filePath, "sample;");
      await writeFile(`${filePath}.map`, sourceMapText);

      const failure = await Assert.throwsAsync(() => new CoverageAnalyzer().analyzeAsync(
        directory,
        [new CoverageProject("Sample", productionDirectory, directory)]), TestingException);

      Assert.areEqual(`The source map for "${filePath.replaceAll("\\", "/")}" is malformed.`, failure.message);
      Assert.isInstanceOf(failure.cause, TestingException);
      Assert.areEqual(
        "A source map must contain a numeric version, string mappings, and string-array sources; optional sourceRoot must be a string and names a string array.",
        failure.cause.message);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA"}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAA","names":[],"sourceRoot":""}')
  @TestData('{"version":3,"sources":["sample.ts"],"mappings":"AAAAA","names":["sample"],"sourceRoot":"."}')
  public async acceptsValidSourceMapShapesAsync(sourceMapText: string): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-map-shape-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      await writeFile(filePath, "sample;");
      await writeFile(`${filePath}.map`, sourceMapText);

      const result = await new CoverageAnalyzer().analyzeAsync(directory, [new CoverageProject("Sample", productionDirectory, productionDirectory)]);

      Assert.areEqual("sample.ts", result.fileCoverages[0]?.relativePath);
      Assert.areEqual("1", result.fileCoverages[0]?.uncoveredLineRanges[0]?.displayText);
      Assert.isFalse(result.isComplete);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  @TestData("\n")
  @TestData("\r\n")
  @TestData("\r")
  @TestData("\u2028")
  @TestData("\u2029")
  public async mapsLineStartsAndColumnsThroughTheSameLookupAsync(lineBreak: string): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-map-positions-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      const fileText = `😀x;${lineBreak}abcd;`;
      const secondStart = 4 + lineBreak.length;
      await writeFile(filePath, fileText);
      await writeFile(`${filePath}.map`, JSON.stringify({
        version: 3,
        sources: ["sample.ts"],
        mappings: "AAAA,EAIA;AAMA,EAOA"
      }));
      await writeFile(join(directory, "coverage.json"), JSON.stringify({
        result: [{
          url: pathToFileURL(filePath).href,
          functions: [{ ranges: [
            { startOffset: 0, endOffset: fileText.length, count: 0 },
            { startOffset: 0, endOffset: 1, count: 0 },
            { startOffset: 2, endOffset: 3, count: 0 },
            { startOffset: secondStart, endOffset: secondStart + 1, count: 0 },
            { startOffset: secondStart + 2, endOffset: secondStart + 3, count: 0 },
            { startOffset: fileText.length, endOffset: fileText.length, count: 0 }
          ] }]
        }]
      }));

      const result = await new CoverageAnalyzer().analyzeAsync(directory, [new CoverageProject("Sample", productionDirectory, productionDirectory)]);
      const coverage = result.fileCoverages[0];
      Assert.isDefined(coverage);
      Assert.areEqual("sample.ts", coverage.relativePath);
      Assert.areEqual("1,5,11,18,18", coverage.blockCoverages.map(t => t.line).join(","));
      Assert.areEqual("1-18", coverage.uncoveredLineRanges[0]?.displayText);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  @TestData("\n        ", 0)
  @TestData("\r\n\t", 0)
  @TestData("\r", 0)
  @TestData("\u2028\u00a0", 0)
  @TestData("\u2029", 0)
  @TestData(" ", 0)
  @TestData("\n        ", 1)
  public async ignoresWhitespaceOnlyOverridesOfCoveredCodeAsync(whitespace: string, count: number): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-coverage-whitespace-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      const beforeWhitespace = "try { run(); } catch { fail(); }";
      const fileText = `${beforeWhitespace}${whitespace}finally { cleanup(); }`;
      await writeFile(filePath, fileText);
      await writeFile(join(directory, "coverage.json"), JSON.stringify({
        result: [{
          url: pathToFileURL(filePath).href,
          functions: [{ ranges: [
            { startOffset: 0, endOffset: fileText.length, count: 1 },
            { startOffset: beforeWhitespace.length, endOffset: beforeWhitespace.length + whitespace.length, count }
          ] }]
        }]
      }));

      const result = await new CoverageAnalyzer().analyzeAsync(directory, [new CoverageProject("Sample", productionDirectory, productionDirectory)]);
      const coverage = result.fileCoverages[0];
      Assert.isDefined(coverage);
      Assert.isTrue(result.isComplete);
      Assert.areEqual(fileText.length, coverage.totalLength);
      Assert.areEqual(0, coverage.uncoveredLength);
      Assert.areEqual(0, coverage.uncoveredLineRanges.length);
      Assert.areEqual(0, coverage.blockCount);
      Assert.areEqual(0, coverage.takenBlockCount);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  @TestData(0)
  @TestData(1)
  public async preservesUncoveredCodeContainingWhitespaceRangesAsync(count: number): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-coverage-whitespace-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      const prefix = "try { run(); } ";
      const uncoveredCode = "catch {\n  fail();\n}";
      const fileText = `${prefix}${uncoveredCode} finally { cleanup(); }`;
      const whitespaceStart = fileText.indexOf("\n");
      await writeFile(filePath, fileText);
      await writeFile(join(directory, "coverage.json"), JSON.stringify({
        result: [{
          url: pathToFileURL(filePath).href,
          functions: [{ ranges: [
            { startOffset: 0, endOffset: fileText.length, count: 1 },
            { startOffset: prefix.length, endOffset: prefix.length + uncoveredCode.length, count: 0 },
            { startOffset: whitespaceStart, endOffset: whitespaceStart + 3, count }
          ] }]
        }]
      }));

      const result = await new CoverageAnalyzer().analyzeAsync(directory, [new CoverageProject("Sample", productionDirectory, productionDirectory)]);
      const coverage = result.fileCoverages[0];
      Assert.isDefined(coverage);
      Assert.isFalse(result.isComplete);
      Assert.areEqual(uncoveredCode.length, coverage.uncoveredLength);
      Assert.areEqual(1, coverage.uncoveredLineRanges.length);
      Assert.areEqual("1-3", coverage.uncoveredLineRanges[0]?.displayText);
      Assert.areEqual(1, coverage.blockCount);
      Assert.areEqual(0, coverage.takenBlockCount);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async keepsUnreportedWhitespaceUncoveredAsync(): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-coverage-whitespace-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      const firstStatement = "first();";
      const fileText = `${firstStatement}\n\nlast();`;
      await writeFile(filePath, fileText);
      await writeFile(join(directory, "coverage.json"), JSON.stringify({
        result: [{
          url: pathToFileURL(filePath).href,
          functions: [
            { ranges: [{ startOffset: 0, endOffset: firstStatement.length, count: 1 }] },
            { ranges: [{ startOffset: firstStatement.length + 2, endOffset: fileText.length, count: 1 }] }
          ]
        }]
      }));

      const result = await new CoverageAnalyzer().analyzeAsync(directory, [new CoverageProject("Sample", productionDirectory, productionDirectory)]);
      const coverage = result.fileCoverages[0];
      Assert.isDefined(coverage);
      Assert.isFalse(result.isComplete);
      Assert.areEqual(2, coverage.uncoveredLength);
      Assert.areEqual("1-2", coverage.uncoveredLineRanges[0]?.displayText);
      Assert.areEqual(0, coverage.blockCount);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async rejectsOutOfBoundsWhitespaceRangesBeforeFilteringAsync(): Promise<void> {
    const directory = await mkdtemp(join(tmpdir(), "context-coverage-whitespace-"));
    try {
      const productionDirectory = join(directory, "production");
      await mkdir(productionDirectory);
      const filePath = join(productionDirectory, "sample.js");
      const fileText = "run();\n ";
      await writeFile(filePath, fileText);
      await writeFile(join(directory, "coverage.json"), JSON.stringify({
        result: [{
          url: pathToFileURL(filePath).href,
          functions: [{ ranges: [
            { startOffset: 0, endOffset: fileText.length, count: 1 },
            { startOffset: fileText.indexOf("\n"), endOffset: fileText.length + 1, count: 0 }
          ] }]
        }]
      }));

      await Assert.throwsAsync(() => new CoverageAnalyzer().analyzeAsync(
        directory,
        [new CoverageProject("Sample", productionDirectory, productionDirectory)]), TestingException);
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async reportsUncoveredLinesOfIncludedFilesOnlyAsync(): Promise<void> {
    const coverageDirectory = await mkdtemp(join(tmpdir(), "context-coverage-"));
    try {
      const includedDirectory = join(coverageDirectory, "included");
      await mkdir(includedDirectory);

      const sampleText = "line one;\nline two;\nline three;\nline four;\n";
      const samplePath = join(includedDirectory, "sample.js");
      await writeFile(samplePath, sampleText);
      const excludedPath = join(coverageDirectory, "excluded.js");
      await writeFile(excludedPath, sampleText);

      const report = {
        result: [
          {
            url: pathToFileURL(samplePath).href,
            functions: [{ ranges: [
              { startOffset: 0, endOffset: sampleText.length, count: 1 },
              { startOffset: 10, endOffset: 20, count: 0 },
              { startOffset: 20, endOffset: 31, count: 0 },
            ] }],
          },
          {
            url: pathToFileURL(excludedPath).href,
            functions: [{ ranges: [{ startOffset: 0, endOffset: sampleText.length, count: 0 }] }],
          },
          {
            url: "node:internal/modules",
            functions: [{ ranges: [{ startOffset: 0, endOffset: 10, count: 0 }] }],
          },
        ],
      };
      await writeFile(join(coverageDirectory, "coverage-1.json"), JSON.stringify(report));
      await writeFile(join(coverageDirectory, "ignored.txt"), "not a report");

      const result = await new CoverageAnalyzer().analyzeAsync(coverageDirectory, [new CoverageProject("Sample", includedDirectory, coverageDirectory)]);

      Assert.areEqual(1, result.fileCoverages.length);
      Assert.isFalse(result.isComplete);
      Assert.areEqual(1, result.incompleteFileCoverages.length);
      Assert.areEqual(1, result.fileCoverages[0]?.uncoveredLineRanges.length);
      Assert.areEqual<string | undefined>("2-3", result.fileCoverages[0]?.uncoveredLineRanges[0]?.displayText);
      Assert.areEqual<number | undefined>(2, result.fileCoverages[0]?.blockCount);
      Assert.areEqual<number | undefined>(0, result.fileCoverages[0]?.takenBlockCount);
      Assert.areEqual<string | undefined>("sample.js", result.fileCoverages[0]?.relativePath);
    }
    finally {
      await rm(coverageDirectory, { recursive: true, force: true });
    }
  }
}
