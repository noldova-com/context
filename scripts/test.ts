/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This script compiles every test project against the installed packages,
 * runs the complete suite through noldova.context.testing in a child process
 * measured by V8 coverage, and enforces complete production coverage. Each
 * test class's results print as soon as the class finishes; in a terminal, an
 * animated progress line shows until the totals print.
 *
 * @example
 * npm run test - runs the complete suite and the coverage gate.
 * npm run test -- <filter...> - runs tests matching any package, file, class, ClassName.methodName substring, or exact category:name identity; a filtered run skips the coverage gate.
 * npm run test -- --skip-test-details - hides passing per-test lines; failures, skips, and totals always print.
 * npm run test -- --skip-coverage-details - hides fully covered file rows; incomplete files and the overall row always print.
 */

import { join } from "node:path";

import { CommandFailedException } from "../src/noldova.context.tooling/src/api/index.ts";
import Config from "./config.ts";
import Script from "./script.ts";

export class Test extends Script {
  private static readonly BLANK_LINE: string = "";
  private static readonly COVERAGE_INCOMPLETE: string = "Production coverage is incomplete.";
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly ENABLED_VALUE: string = "1";
  private static readonly FILTERS_VARIABLE: string = "CONTEXT_TEST_FILTERS";
  private static readonly FILTERED_COVERAGE_SKIPPED: string = "Coverage gate skipped for a filtered run.";
  private static readonly NODE_MODULES_DIRECTORY_NAME: string = "node_modules";
  private static readonly NO_TEST_PROJECTS: string = "No test projects were found.";
  private static readonly OPTION_PREFIX: string = "--";
  private static readonly SKIP_COVERAGE_DETAILS_OPTION: string = "--skip-coverage-details";
  private static readonly SKIP_TEST_DETAILS_OPTION: string = "--skip-test-details";
  private static readonly SKIP_TEST_DETAILS_VARIABLE: string = "CONTEXT_SKIP_TEST_DETAILS";
  private static readonly SOURCE_MAPS_OPTION: string = "--enable-source-maps";
  private static readonly TEST_ENTRY_PATH: string = "node_modules/@noldova/context.testing/services/execution/test-run-entry-point.js";
  private static readonly TEST_PROJECT_SUFFIX: string = ".tests";
  private static readonly TEST_TSCONFIG_PATH: string = "tests/tsconfig.json";

  public override async runAsync(): Promise<void> {
    const knownFlags = [Test.SKIP_TEST_DETAILS_OPTION, Test.SKIP_COVERAGE_DETAILS_OPTION];
    const flags = new Set<string>();
    const filters: string[] = [];

    for (const argument of process.argv.slice(2)) {
      if (!argument.startsWith(Test.OPTION_PREFIX)) {
        filters.push(argument);
        continue;
      }

      if (!knownFlags.includes(argument)) {
        await this.writeLogAsync(Test.unknownOption(argument, knownFlags));
        process.exitCode = 1;
        return;
      }

      flags.add(argument);
    }

    const testProjectArguments: string[] = [];

    for (const packageInfo of Config.PACKAGES_INFO) {
      const testTsconfigPath = `${Test.SOURCE_DIRECTORY_NAME}/${packageInfo.path}/${Test.TEST_TSCONFIG_PATH}`;
      if (!await this.pathExistsAsync(testTsconfigPath))
        continue;

      const testProjectName = `${packageInfo.name}${Test.TEST_PROJECT_SUFFIX}`;
      const testBuildDirectory = `${Config.BUILD_FOLDER}/${testProjectName}`;

      await this.runStepAsync(Test.compilingProject(testProjectName), async () => {
        await this.removeDirectoryAsync(testBuildDirectory);
        await this.executeTypeScriptCompilerAsync([Test.TYPESCRIPT_PROJECT_OPTION, testTsconfigPath]);
      });

      testProjectArguments.push(packageInfo.name, testBuildDirectory);
    }

    if (testProjectArguments.length === 0) {
      await this.writeLogAsync(Test.NO_TEST_PROJECTS);
      process.exitCode = 1;
      return;
    }

    await this.writeLogAsync(Test.BLANK_LINE);

    const environment: Record<string, string> = {};
    environment[Test.FILTERS_VARIABLE] = JSON.stringify(filters);

    if (flags.has(Test.SKIP_TEST_DETAILS_OPTION))
      environment[Test.SKIP_TEST_DETAILS_VARIABLE] = Test.ENABLED_VALUE;

    if (filters.length === 0) {
      await this.removeDirectoryAsync(Config.COVERAGE_FOLDER);
      await this.createDirectoryAsync(Config.COVERAGE_FOLDER);
      environment[Test.COVERAGE_VARIABLE] = Config.COVERAGE_FOLDER;
    }

    try {
      await this.executeProcessAsync(
        process.execPath,
        [Test.SOURCE_MAPS_OPTION, Test.TEST_ENTRY_PATH, ...testProjectArguments],
        process.cwd(),
        false,
        environment);
    }
    catch (error) {
      // The run has printed its own failures; any other error, such as one starting it, propagates.
      if (!(error instanceof CommandFailedException))
        throw error;

      process.exitCode = 1;
    }

    if (filters.length > 0) {
      await this.writeLogAsync(Test.FILTERED_COVERAGE_SKIPPED);
      return;
    }

    const testing = await import("@noldova/context.testing");
    const coverageProjects = Config.PACKAGES_INFO.map(t => new testing.CoverageProject(
      t.name,
      join(Test.NODE_MODULES_DIRECTORY_NAME, t.packageName),
      join(Test.SOURCE_DIRECTORY_NAME, t.path, Test.SOURCE_DIRECTORY_NAME)));
    const coverage = await new testing.CoverageAnalyzer().analyzeAsync(Config.COVERAGE_FOLDER, coverageProjects);

    await this.writeLogAsync(Test.BLANK_LINE);
    for (const line of new testing.CoverageReportWriter().formatLines(coverage, flags.has(Test.SKIP_COVERAGE_DETAILS_OPTION)))
      await this.writeLogAsync(line);

    if (!coverage.isComplete) {
      await this.writeLogAsync(Test.COVERAGE_INCOMPLETE);
      process.exitCode = 1;
    }
  }

  private static compilingProject(projectName: string): string {
    return `Compiling "${projectName}"...`;
  }

  private static unknownOption(option: string, knownOptions: readonly string[]): string {
    return `Unknown option "${option}". Known options: ${knownOptions.join(", ")}.`;
  }
}

const test = new Test();
await test.runAsEntryPointAsync();
