/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { EntryRun } from "../../fixtures/execution/entry-run.fixture.js";
import { FixtureTestProject } from "../../fixtures/execution/fixture-test-project.fixture.js";

@TestClass
export class TestRunEntryPointTests {
  private static readonly EARLY_CALL_COUNTED: RegExp = /"functionName":"isolateTemporaryFilesAsync","ranges":\[\{"startOffset":\d+,"endOffset":\d+,"count":1\}/u;

  @TestMethod
  public async reportsAContractViolationAsACleanVerdictAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await writeFile(join(rootDirectory, "empty.test.js"), "export {};\n");

      const entryRun = await this.runEntryArgumentsAsync(["TestPackage", rootDirectory], "[]", undefined, false);

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

  @TestMethod
  public async namesATestThatReachesTheLimitTheSuiteSetsWithThatLimitAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "hanging.test.js", "hanging-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", undefined, true, { CONTEXT_TEST_TIMEOUT_MILLISECONDS: "100" });

      Assert.areEqual(1, result.exitCode);
      Assert.isTrue(result.output.includes("HangingFixtureTests"), result.output);
      Assert.isTrue(result.output.includes("hangsAsync"), result.output);
      Assert.isTrue(result.output.includes("The test did not settle within its limit of 100 milliseconds."), result.output);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async rejectsALimitThatIsNotAPositiveIntegerAsync(): Promise<void> {
    const entryRun = await this.runEntryArgumentsAsync([], "[]", undefined, true, { CONTEXT_TEST_TIMEOUT_MILLISECONDS: "soon" });

    Assert.areEqual(1, entryRun.exitCode);
    Assert.isTrue(entryRun.errorOutput.includes("CONTEXT_TEST_TIMEOUT_MILLISECONDS must be a positive integer of milliseconds"), entryRun.errorOutput);
  }

  @TestMethod
  public async endsTheProcessesAStoppedTestLeftSoItsWorkerEndsAfterItsResultsAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    const resultsDirectory = await mkdtemp(join(tmpdir(), "context-entry-results-"));
    try {
      const resultsFile = join(resultsDirectory, "results.json");
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "blocking.test.js", "blocking-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", undefined, true,
        { CONTEXT_TEST_TIMEOUT_MILLISECONDS: "2000", CONTEXT_TEST_STOP_LIMIT_MILLISECONDS: "1000", CONTEXT_TEST_RESULTS_FILE: resultsFile });
      const results = await readFile(resultsFile, "utf8");

      Assert.areEqual(1, result.exitCode, result.errorOutput);
      Assert.isTrue(results.includes("\"methodName\":\"waitsOnAChildProcess\",\"outcome\":\"Failed\""), results);
      Assert.isTrue(results.includes("\"methodName\":\"passesAfterTheBlock\",\"outcome\":\"Passed\""), results);
      Assert.isTrue(result.output.includes("Failed:"), result.output);
      Assert.isTrue(result.errorOutput.includes("Test workers that could not be ended within 1000 milliseconds of being stopped: 1, running " +
        "BlockingFixtureTests.waitsOnAChildProcess.\n"), result.errorOutput);
      const ended = /\nProcesses the run ended that were still running under it: (\d+)((?:, process \d+)+)\.\n/u.exec(result.errorOutput);
      Assert.areEqual(String((ended?.[2] ?? String.empty).split(", process ").length - 1), ended?.[1], result.errorOutput);
      Assert.isFalse(result.errorOutput.includes("ends its own process"), result.errorOutput);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(resultsDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async endsItsOwnProcessAfterItsResultsWhenItCannotListTheProcessesAStoppedTestLeftAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    const resultsDirectory = await mkdtemp(join(tmpdir(), "context-entry-results-"));
    const emptyDirectory = await mkdtemp(join(tmpdir(), "context-entry-path-"));
    try {
      const resultsFile = join(resultsDirectory, "results.json");
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "blocking.test.js", "blocking-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", undefined, true,
        { CONTEXT_TEST_TIMEOUT_MILLISECONDS: "2000", CONTEXT_TEST_STOP_LIMIT_MILLISECONDS: "1000", CONTEXT_TEST_RESULTS_FILE: resultsFile, PATH: emptyDirectory });
      const results = await readFile(resultsFile, "utf8");

      Assert.areEqual(process.platform === "win32" ? 1 : -1, result.exitCode, result.errorOutput);
      Assert.isTrue(results.includes("\"methodName\":\"waitsOnAChildProcess\",\"outcome\":\"Failed\""), results);
      Assert.isTrue(results.includes("\"methodName\":\"passesAfterTheBlock\",\"outcome\":\"Passed\""), results);
      Assert.isTrue(result.output.includes("Failed:"), result.output);
      Assert.isTrue(result.errorOutput.includes("Test workers that could not be ended within 1000 milliseconds of being stopped: 1, running " +
        "BlockingFixtureTests.waitsOnAChildProcess.\n"), result.errorOutput);
      Assert.isTrue(result.errorOutput.includes("The run could not end the processes still running under it.\n"), result.errorOutput);
      Assert.isTrue(result.errorOutput.includes("ENOENT"), result.errorOutput);
      Assert.isTrue(result.errorOutput.endsWith("The stopped tests' workers still have not ended, so the run ends its own process so it cannot hang.\n"),
        result.errorOutput);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(resultsDirectory, { recursive: true, force: true });
      await rm(emptyDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async writesOneMainThreadProfileWhenItEndsItsOwnProcessAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    const coverageDirectory = await mkdtemp(join(tmpdir(), "context-entry-coverage-"));
    const emptyDirectory = await mkdtemp(join(tmpdir(), "context-entry-path-"));
    try {
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "blocking.test.js", "blocking-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", undefined, true,
        { CONTEXT_TEST_TIMEOUT_MILLISECONDS: "2000", CONTEXT_TEST_STOP_LIMIT_MILLISECONDS: "1000", NODE_V8_COVERAGE: coverageDirectory, PATH: emptyDirectory });
      const mainThreadProfiles = (await readdir(coverageDirectory)).filter(t => t.startsWith(`coverage-${result.processId}-`) && t.endsWith("-0.json"));
      const profiles = await Promise.all(mainThreadProfiles.map(t => readFile(join(coverageDirectory, t), "utf8")));

      Assert.isTrue(result.errorOutput.endsWith("The stopped tests' workers still have not ended, so the run ends its own process so it cannot hang.\n"),
        result.errorOutput);
      Assert.areEqual(1, mainThreadProfiles.length, mainThreadProfiles.join());
      Assert.isTrue(profiles.every(t => TestRunEntryPointTests.EARLY_CALL_COUNTED.test(t)), mainThreadProfiles.join());
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(coverageDirectory, { recursive: true, force: true });
      await rm(emptyDirectory, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async failsARunThatCannotRemoveItsTemporaryFolderAsync(): Promise<void> {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "context-entry-temporary-"));
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    try {
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "replacing.test.js", "replacing-temporary-folder-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", temporaryRoot);

      Assert.areEqual(1, result.exitCode, result.errorOutput);
      Assert.isTrue(result.output.includes("Passed:"), result.output);
      Assert.isTrue(result.errorOutput.includes("The run could not remove its temporary folder "), result.errorOutput);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async writesEachTestsResultToTheFileTheSuiteNamesAsync(): Promise<void> {
    const rootDirectory = await mkdtemp(join(tmpdir(), "context-entry-"));
    const resultsDirectory = await mkdtemp(join(tmpdir(), "context-entry-results-"));
    try {
      const resultsFile = join(resultsDirectory, "results.json");
      await FixtureTestProject.writeTestFileAsync(rootDirectory, "passing.test.js", "passing-fixture");
      const result = await this.runEntryArgumentsAsync(["Sample", rootDirectory], "[]", undefined, true, { CONTEXT_TEST_RESULTS_FILE: resultsFile });
      const text = await readFile(resultsFile, "utf8");
      const withoutDurations = JSON.stringify(JSON.parse(text), (key, value: unknown) => key === "durationMilliseconds" ? undefined : value);

      Assert.areEqual(0, result.exitCode);
      Assert.areEqual("[{\"packageName\":\"Sample\",\"filePath\":\"passing.test.js\",\"className\":\"PassingFixtureTests\",\"methodName\":\"passes\",\"outcome\":\"Passed\"}]",
        withoutDurations);
      Assert.isTrue(/"durationMilliseconds":[0-9.]+\}\]$/u.test(text), text);
    }
    finally {
      await rm(rootDirectory, { recursive: true, force: true });
      await rm(resultsDirectory, { recursive: true, force: true });
    }
  }

  private runEntryAsync(packageName: string, rootDirectory: string): Promise<EntryRun> {
    return this.runEntryArgumentsAsync([packageName, rootDirectory]);
  }

  private runEntryArgumentsAsync(arguments_: readonly string[], filters: string | null = "[]", temporaryDirectory?: string, coverage: boolean = true,
    variables: Readonly<Record<string, string>> = {}): Promise<EntryRun> {
    return new Promise<EntryRun>((resolve, reject) => {
      const environment = { ...process.env };
      delete environment["CONTEXT_TEST_TIMEOUT_MILLISECONDS"];
      delete environment["CONTEXT_TEST_STOP_LIMIT_MILLISECONDS"];
      delete environment["CONTEXT_TEST_RESULTS_FILE"];
      for (const name of Object.keys(environment))
        if (Object.hasOwn(variables, name.toUpperCase()))
          delete environment[name];

      Object.assign(environment, variables);
      if (!coverage)
        delete environment["NODE_V8_COVERAGE"];
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
      const output: string[] = [];
      child.stderr.on("data", (t: Buffer) => {
        errorOutput.push(t.toString());
      });
      child.stdout.on("data", (t: Buffer) => {
        output.push(t.toString());
      });
      child.on("close", t => {
        resolve(new EntryRun(t ?? -1, errorOutput.join(String.empty), output.join(String.empty), child.pid ?? -1));
      });
      child.on("error", reject);
    });
  }
}
