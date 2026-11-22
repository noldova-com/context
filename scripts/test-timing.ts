/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CommandFailedException from "./command-failed.exception.ts";
import SuiteScript from "./suite-script.ts";

export class TestTiming extends SuiteScript {
  private static readonly RUNS: number = 3;
  private static readonly FILE_BUDGET_MILLISECONDS: number = 2_000;
  private static readonly MARGIN: number = 0.5;
  private static readonly TIMING_FOLDER: string = "_build/timing";
  private static readonly README_PATH: string = "README.md";
  private static readonly ENABLED_VALUE: string = "1";
  private static readonly SKIP_TEST_DETAILS_VARIABLE: string = "CONTEXT_SKIP_TEST_DETAILS";
  private static readonly NOT_BUILT: string = "The test projects are not built; run npm test first.";

  public override async runAsync(): Promise<void> {
    const projects = await this.listTestProjectsAsync();
    for (const packageInfo of projects)
      if (!await this.pathExistsAsync(TestTiming.testBuildDirectory(packageInfo))) {
        await this.writeLogAsync(TestTiming.NOT_BUILT);
        process.exitCode = 1;
        return;
      }

    const testing = await import("@noldova/context.testing");
    await this.removeDirectoryAsync(TestTiming.TIMING_FOLDER);
    await this.createDirectoryAsync(TestTiming.TIMING_FOLDER);
    const runs: InstanceType<typeof testing.TestTimeRecord>[][] = [];
    for (let run = 1; run <= TestTiming.RUNS; run++) {
      const resultsFile = `${TestTiming.TIMING_FOLDER}/run-${run}.json`;
      const environment: Record<string, string> = {};
      environment[TestTiming.FILTERS_VARIABLE] = JSON.stringify([]);
      environment[TestTiming.SKIP_TEST_DETAILS_VARIABLE] = TestTiming.ENABLED_VALUE;
      environment[TestTiming.RESULTS_FILE_VARIABLE] = resultsFile;
      await this.writeLogAsync(TestTiming.startingRun(run));
      try {
        await this.runSuiteAsync(projects, environment);
      }
      catch (error) {
        if (!(error instanceof CommandFailedException))
          throw error;

        await this.writeLogAsync(error.message);
        await this.writeLogAsync(TestTiming.runFailed(run));
        process.exitCode = 1;
        return;
      }

      runs.push(testing.TestTimeRecord.parseAll(await this.readFileAsync(resultsFile)));
    }

    const listed = testing.TestTimingCheck.readListed(await this.readFileAsync(TestTiming.README_PATH));
    const timings = new testing.TestTimingCheck(TestTiming.FILE_BUDGET_MILLISECONDS, TestTiming.MARGIN, listed).judge(runs);
    for (const timing of timings.filter(t => t.isOver || t.isListed))
      await this.writeLogAsync(timing.format());

    await this.writeLogAsync(testing.TestTimingCheck.formatSummary(timings, TestTiming.RUNS));
    process.exitCode = timings.some(t => t.isOver) ? 1 : 0;
  }

  private static startingRun(run: number): string {
    return `Timing run ${run} of ${TestTiming.RUNS}...`;
  }

  private static runFailed(run: number): string {
    return `Timing run ${run} failed; the timing check judges only a passing suite.`;
  }
}

const timing = new TestTiming();
await timing.runAsEntryPointAsync();
