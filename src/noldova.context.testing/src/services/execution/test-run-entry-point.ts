/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { takeCoverage } from "node:v8";

import "@noldova/context.core";
import { ExceptionOptions } from "@noldova/context.exceptions";

import { TestingException } from "../../exceptions/testing.exception.js";
import { TestProject } from "../../models/discovery/test-project.js";
import type { TestRunResult } from "../../models/results/test-run-result.js";
import { TestRunTotals } from "../../models/results/test-run-totals.js";
import { TestTimeRecord } from "../../models/timing/test-time-record.js";
import { Resources } from "../../resources.js";
import { TestConsoleReporter } from "../reporting/test-console-reporter.js";
import { TestRunSupervisor } from "./test-run-supervisor.js";

export class TestRunEntryPoint {

  public async runAsync(): Promise<void> {
    const testProjectArguments = process.argv.slice(2);
    const skipPassingDetails = !Object.isUndefined(process.env[Resources.skipTestDetailsVariable]);
    const reporter = new TestConsoleReporter(t => process.stdout.write(t), process.stdout.isTTY === true, skipPassingDetails);
    const temporaryDirectory = await this.isolateTemporaryFilesAsync();
    let supervisor: TestRunSupervisor | undefined;

    try {
      const filters = this.parseFilters(process.env[Resources.filtersVariable]);

      const testProjects: TestProject[] = [];
      for (let index = 0; index < testProjectArguments.length; index += 2) {
        const packageName = testProjectArguments[index];
        const rootDirectory = testProjectArguments[index + 1];
        if (Object.isUndefined(packageName) || Object.isUndefined(rootDirectory))
          throw new TestingException(Resources.testProjectPairRequired);

        testProjects.push(new TestProject(packageName, rootDirectory));
      }

      const timeoutMilliseconds = TestRunSupervisor.readTimeoutMilliseconds(process.env[Resources.timeoutVariable]);
      supervisor = new TestRunSupervisor(timeoutMilliseconds, testProjects, filters, reporter, TestRunSupervisor.readCoverageDirectory());
      reporter.start();
      const result = await supervisor.runAsync();
      const totals = new TestRunTotals(result.passed, result.failed, result.skipped, supervisor.elapsedMilliseconds);

      reporter.writeSummary(totals, supervisor.selection);
      await this.writeResultsAsync(result, process.env[Resources.resultsFileVariable]);
      if (supervisor.selection.isFiltered && supervisor.selection.selected === 0)
        console.error(Resources.noTestMatchedFilters);

      process.exitCode = Math.min(totals.failed + Number(totals.total === 0), 1);
    }
    catch (error) {
      reporter.stop();
      console.error(String(error));
      process.exitCode = 1;
    }

    const leftovers = await this.removeTemporaryFilesAsync(temporaryDirectory);
    if (leftovers.length > 0) {
      console.error(Resources.formatTemporaryLeftovers(leftovers));
      process.exitCode = 1;
    }

    const unendedWorkersMessage = supervisor?.unendedWorkersMessage;
    if (!Object.isUndefined(unendedWorkersMessage))
      await this.endOwnProcessAsync(unendedWorkersMessage);
  }

  private async endOwnProcessAsync(message: string): Promise<void> {
    await new Promise<void>(resolve => process.stdout.write(String.empty, () => resolve()));
    await new Promise<void>(resolve => process.stderr.write(message + Resources.lineSeparator, () => resolve()));
    takeCoverage();
    process.kill(process.pid, Resources.killSignal);
  }

  private async writeResultsAsync(result: TestRunResult, filePath: string | undefined): Promise<void> {
    if (Object.isUndefined(filePath))
      return;

    await writeFile(filePath, TestTimeRecord.formatAll(TestTimeRecord.fromResult(result)));
  }

  private async isolateTemporaryFilesAsync(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), Resources.temporaryDirectoryPrefix));
    for (const variable of Resources.temporaryDirectoryVariables)
      process.env[variable] = directory;

    return directory;
  }

  private async removeTemporaryFilesAsync(directory: string): Promise<string[]> {
    const leftovers = (await readdir(directory)).sort();
    await rm(directory, { recursive: true, force: true, maxRetries: Resources.temporaryRemovalRetries });
    return leftovers;
  }

  private parseFilters(text: string | undefined): string[] {
    if (Object.isUndefined(text))
      throw new TestingException(Resources.testFiltersInvalid);

    let value: unknown;
    try {
      value = JSON.parse(text);
    }
    catch (error) {
      throw new TestingException(Resources.testFiltersInvalid, new ExceptionOptions(error));
    }

    if (!Array.isArray(value))
      throw new TestingException(Resources.testFiltersInvalid);

    const filters: string[] = [];
    for (const filter of value) {
      if (!Object.isString(filter))
        throw new TestingException(Resources.testFiltersInvalid);

      filters.push(filter);
    }

    return filters;
  }
}

await new TestRunEntryPoint().runAsync();
