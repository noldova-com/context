/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EntryRun } from "../../fixtures/execution/entry-run.fixture.js";
import { FixtureTestProject } from "../../fixtures/execution/fixture-test-project.fixture.js";

@TestClass
export class TestRunEntryPointTests {
  @TestMethod
  public async reportsAContractViolationAsACleanVerdictAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await writeFile(join(rootDirectory, "empty.test.js"), "export {};\n");

      const entryRun = await this.runEntryAsync("TestPackage", rootDirectory);

      Assert.areEqual(1, entryRun.exitCode);
      Assert.isTrue(entryRun.errorOutput.includes("TestingException"));
      Assert.isTrue(entryRun.errorOutput.includes("yields no test class"));
      Assert.isFalse(entryRun.errorOutput.includes("    at "));
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async failsAnEmptySelectionLoudlyAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {

      const entryRun = await this.runEntryAsync("TestPackage", rootDirectory);

      Assert.areEqual(1, entryRun.exitCode);
      Assert.isFalse(entryRun.errorOutput.includes("No test matched the filters"));
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async rejectsAnIncompleteProjectPairAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync(["TestPackage"]);

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("requires a package name and a root directory"));
  }

  @TestMethod
  public async rejectsAnEmptyPackageNameAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([String.empty, "compiled/tests"]);

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("ArgumentException"));
  }

  @TestMethod
  public async rejectsAnEmptyRootDirectoryAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync(["TestPackage", String.empty]);

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("ArgumentException"));
  }

  @TestMethod
  public async rejectsMalformedFiltersAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], "not-json");

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("test filters must be a JSON array of strings"));
  }

  @TestMethod
  public async rejectsMissingFiltersAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], null);

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("test filters must be a JSON array of strings"));
  }

  @TestMethod
  public async rejectsFiltersThatAreNotAnArrayAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], "{}");

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("test filters must be a JSON array of strings"));
  }

  @TestMethod
  public async rejectsNonStringFiltersAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], "[1]");

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("test filters must be a JSON array of strings"));
  }

  @TestMethod
  public async acceptsStringFiltersAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], "[\"sample\"]");

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isFalse(entryRun.errorOutput.includes("test filters must be a JSON array of strings"));
    Assert.isTrue(entryRun.errorOutput.includes("No test matched the filters; a filter that selects nothing fails the run."), entryRun.errorOutput);
  }

  @TestMethod
  public async reportsAThrowingTestWithoutAnUncaughtStrayRejectionAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "failing.test.js", "failing-rejection");
      const result = await this.runEntryAsync("Sample", rootDirectory);
      Assert.areEqual(1, result.exitCode);
      Assert.areEqual(String.empty, result.errorOutput);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async failsARunWhoseTestsLeaveFilesInItsTemporaryFolderAsync(): Promise<void> {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "context-entry-temporary-"));
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "leaving.test.js", "leaving-file-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", temporaryRoot);

      Assert.areEqual(1, result.exitCode);
      Assert.isTrue(result.errorOutput.includes("The tests left left-behind.txt in the run's temporary folder"), result.errorOutput);
      Assert.areEqual(0, (await readdir(temporaryRoot)).length);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }

  private runEntryAsync(packageName: string, rootDirectory: string): Promise<EntryRun> {
    return this.runEntryArgumentsAsync([packageName, rootDirectory]);
  }

  private runEntryArgumentsAsync(arguments_: readonly string[], filters: string | null = "[]", temporaryDirectory?: string): Promise<EntryRun> {
    return new Promise<EntryRun>((resolve, reject) => {
      const environment = { ...process.env };
      if (!Object.isUndefined(temporaryDirectory))
        for (const variable of ["TMPDIR", "TEMP", "TMP"])
          environment[variable] = temporaryDirectory;

      if (Object.isNull(filters))
        delete environment["CONTEXT_TEST_FILTERS"];
      else
        environment["CONTEXT_TEST_FILTERS"] = filters;

      const child = spawn(
        process.execPath,
        ["node_modules/@noldova/context.testing/services/execution/test-run-entry-point.js", ...arguments_],
        { env: environment, shell: false });

      const errorOutput: string[] = [];
      child.stderr.on("data", (t: Buffer) => {
        errorOutput.push(t.toString());
      });
      child.on("close", t => {
        resolve(new EntryRun(t ?? -1, errorOutput.join(String.empty)));
      });
      child.on("error", reject);
    });
  }
}
