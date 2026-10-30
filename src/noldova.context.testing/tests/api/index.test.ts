/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import * as api from "@noldova/context.testing";
import { Assert, AssertFailedException, TestClass, TestingException, TestMethod, TestTimeoutException } from "@noldova/context.testing";

@TestClass
export class TestingApiTests {
  @TestMethod
  public exportsTheCompleteCatalog(): void {
    const exportNames = [
      "Assert", "AssertFailedException", "BlockCoverage", "Category", "CoverageAnalyzer", "CoverageProject", "CoverageReportWriter",
      "CoverageResult", "DiscoveredTestClass", "DiscoveredTestMethod", "FileCoverage", "LineRange",
      "ParallelTestRunner", "Skip", "SourceMap", "MappedSourceLine", "TestClass", "TestClassResult", "TestConsoleReporter", "TestData", "TestDiscovery",
      "TestExecutor", "TestingException", "TestMethod", "TestMethodResult", "TestOutcome",
      "TestProject", "TestReportWriter", "TestRunner", "TestRunResult", "TestRunTotals", "TestSelection", "TestTimeoutException",
    ];

    Assert.areEqual(exportNames.sort().join(","), Object.keys(api).sort().join(","));
  }

  @TestMethod
  public exposesTheDeclaredCoreGlobalDependency(): void {
    Assert.areEqual(String.empty, "");
    Assert.isTrue(Object.isNullOrUndefined(undefined));
  }

  @TestMethod
  public exposesThePackageExceptionHierarchy(): void {
    Assert.isInstanceOf(AssertFailedException.prototype, TestingException);
    Assert.isInstanceOf(TestTimeoutException.prototype, TestingException);
  }

  @TestMethod
  public async exposesDependencyAugmentationsInAnIsolatedConsumerAsync(): Promise<void> {
    const directory = await mkdtemp(resolve(import.meta.dirname, "../../../consumer-"));
    try {
      const consumerPath = join(directory, "consumer.ts");
      await writeFile(consumerPath, `
        import "@noldova/context.testing";

        const empty: string = String.empty;
        const formatted: string = String.format("{0}", "value");
        const isUndefined: boolean = Object.isUndefined(undefined);
        if (empty !== "" || formatted !== "value" || !isUndefined)
          throw new Error("Core augmentations were not loaded.");
        const binaryDigit: boolean = String.isAsciiBinaryDigit("1");
        const octalDigit: boolean = String.isAsciiOctalDigit("7");
        if (!binaryDigit || !octalDigit)
          throw new Error("Text augmentations were not loaded.");
      `);
      const configurationPath = join(directory, "tsconfig.json");
      await writeFile(configurationPath, JSON.stringify({
        extends: resolve(import.meta.dirname, "../../../../tsconfig-base.json"),
        compilerOptions: { noEmit: true, types: [] },
        files: ["consumer.ts"],
        include: []
      }));

      const compilerPath = fileURLToPath(new URL("./bin/tsc", import.meta.resolve("typescript/package.json")));
      await promisify(execFile)(process.execPath, [compilerPath, "--project", configurationPath], { windowsHide: true });
      await promisify(execFile)(process.execPath, [consumerPath], { windowsHide: true });
    }
    finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
