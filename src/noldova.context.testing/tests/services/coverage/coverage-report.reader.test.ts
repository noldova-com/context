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

import { Assert, CoverageAnalyzer, CoverageProject, TestClass, TestingException, TestMethod } from "@noldova/context.testing";

@TestClass
export class CoverageReportReaderTests {
  @TestMethod
  public async rejectsMalformedCoverageJsonAsync(): Promise<void> {
    const coverageDirectory = await mkdtemp(join(tmpdir(), "context-coverage-"));
    try {
      const includedDirectory = join(coverageDirectory, "included");
      await mkdir(includedDirectory);
      await writeFile(join(includedDirectory, "sample.js"), "sample;\n");
      await writeFile(join(coverageDirectory, "coverage-1.json"), "not json");

      await Assert.throwsAsync(async () => {
        await new CoverageAnalyzer().analyzeAsync(coverageDirectory, [new CoverageProject("Sample", includedDirectory, coverageDirectory)]);
      }, TestingException);
    }
    finally {
      await rm(coverageDirectory, { recursive: true, force: true });
    }
  }
}
