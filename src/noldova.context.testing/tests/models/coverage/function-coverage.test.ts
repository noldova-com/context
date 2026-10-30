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
export class FunctionCoverageTests {
  @TestMethod
  public async rejectsAFunctionWithoutRangesAsync(): Promise<void> {
    const coverageDirectory = await mkdtemp(join(tmpdir(), "context-function-"));
    try {
      const productionDirectory = join(coverageDirectory, "production");
      await mkdir(productionDirectory);
      await writeFile(join(productionDirectory, "sample.js"), "sample;\n");
      await writeFile(join(coverageDirectory, "coverage.json"), JSON.stringify({
        result: [{ url: "node:sample", functions: [{ ranges: [] }] }],
      }));

      await Assert.throwsAsync(async () => {
        await new CoverageAnalyzer().analyzeAsync(coverageDirectory, [new CoverageProject("Sample", productionDirectory, coverageDirectory)]);
      }, TestingException);
    }
    finally {
      await rm(coverageDirectory, { recursive: true, force: true });
    }
  }
}
