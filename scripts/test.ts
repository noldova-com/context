/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { join } from "node:path";

import CommandFailedException from "./command-failed.exception.ts";
import Config from "./config.ts";
import SuiteScript from "./suite-script.ts";

export class Test extends SuiteScript {
  private static readonly BLANK_LINE: string = "";
  private static readonly COVERAGE_INCOMPLETE: string = "Production coverage is incomplete.";
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly ENABLED_VALUE: string = "1";
  private static readonly FILTERED_COVERAGE_SKIPPED: string = "Coverage gate skipped for a filtered run.";
  private static readonly NODE_MODULES_DIRECTORY_NAME: string = "node_modules";
  private static readonly OPTION_PREFIX: string = "--";
  private static readonly RESULTS_FILE_PATH: string = `${Config.BUILD_FOLDER}/test-results.json`;
  private static readonly SLOWEST_TEST_COUNT: number = 10;
  private static readonly SKIP_COVERAGE_DETAILS_OPTION: string = "--skip-coverage-details";
  private static readonly SKIP_TEST_DETAILS_OPTION: string = "--skip-test-details";
  private static readonly SKIP_TEST_DETAILS_VARIABLE: string = "CONTEXT_SKIP_TEST_DETAILS";

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

    const projects = await this.listTestProjectsAsync();
    for (const project of projects)
      await this.runStepAsync(Test.compilingProject(project.projectName), async () => {
        await this.removeDirectoryAsync(project.buildDirectory);
        await this.executeTypeScriptCompilerAsync([Test.TYPESCRIPT_PROJECT_OPTION, project.tsconfigPath]);
        if (project.sourceTsconfigPath !== undefined)
          await this.executeTypeScriptCompilerAsync([Test.TYPESCRIPT_PROJECT_OPTION, project.sourceTsconfigPath]);
      });

    await this.writeLogAsync(Test.BLANK_LINE);

    const environment: Record<string, string> = {};
    environment[Test.FILTERS_VARIABLE] = JSON.stringify(filters);
    environment[Test.RESULTS_FILE_VARIABLE] = Test.RESULTS_FILE_PATH;
    await this.removeDirectoryAsync(Test.RESULTS_FILE_PATH);

    if (flags.has(Test.SKIP_TEST_DETAILS_OPTION))
      environment[Test.SKIP_TEST_DETAILS_VARIABLE] = Test.ENABLED_VALUE;

    if (filters.length === 0) {
      await this.removeDirectoryAsync(Config.COVERAGE_FOLDER);
      await this.createDirectoryAsync(Config.COVERAGE_FOLDER);
      environment[Test.COVERAGE_VARIABLE] = Config.COVERAGE_FOLDER;
    }

    try {
      await this.runSuiteAsync(projects, environment);
    }
    catch (exception) {
      if (!(exception instanceof CommandFailedException))
        throw exception;

      await this.writeLogAsync(exception.message);
      process.exitCode = 1;
    }

    await this.writeSlowestTestsAsync();

    if (filters.length > 0) {
      await this.writeLogAsync(Test.FILTERED_COVERAGE_SKIPPED);
      return;
    }

    const testing = await import("@noldova/context.testing");
    const coverageProjects = Config.PACKAGES_INFO.map(t => new testing.CoverageProject(
      t.name,
      join(Test.NODE_MODULES_DIRECTORY_NAME, t.packageName),
      join(Test.SOURCE_DIRECTORY_NAME, t.path, Test.SOURCE_DIRECTORY_NAME)));
    let coverage: InstanceType<typeof testing.CoverageResult>;
    try {
      coverage = await new testing.CoverageAnalyzer().analyzeAsync(Config.COVERAGE_FOLDER, coverageProjects);
    }
    catch (exception) {
      if (!(exception instanceof testing.TestingException))
        throw exception;

      await this.writeLogAsync(exception.message);
      process.exitCode = 1;
      return;
    }

    await this.writeLogAsync(Test.BLANK_LINE);
    for (const line of new testing.CoverageReportWriter().formatLines(coverage, flags.has(Test.SKIP_COVERAGE_DETAILS_OPTION)))
      await this.writeLogAsync(line);

    if (!coverage.isComplete) {
      await this.writeLogAsync(Test.COVERAGE_INCOMPLETE);
      process.exitCode = 1;
    }
  }

  private async writeSlowestTestsAsync(): Promise<void> {
    if (!await this.pathExistsAsync(Test.RESULTS_FILE_PATH))
      return;

    const testing = await import("@noldova/context.testing");
    const records = testing.TestTimeRecord.parseAll(await this.readFileAsync(Test.RESULTS_FILE_PATH));
    await this.writeLogAsync(Test.BLANK_LINE);
    for (const line of testing.TestTimeRecord.formatSlowest(records, Test.SLOWEST_TEST_COUNT))
      await this.writeLogAsync(line);
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
