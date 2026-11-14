/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * The timing check, kept apart from npm test since its pass condition is a
 * time: it runs the compiled suite three times without coverage, takes each
 * test file's median time, the sum of its tests' durations, and fails a file
 * whose median exceeds 2 seconds that README's list of slower test files
 * doesn't name, or a listed file whose median exceeds the time the list gives
 * it, each with a margin of 50%, since a busy machine slows every file and the
 * median of three runs drops one slow run but not a slower machine. Run it
 * after npm test, which builds the test projects.
 *
 * @example
 * npm run test:timing - runs the suite three times and judges each test file's median time.
 */

import CommandFailedException from "./command-failed.exception.ts";
import SuiteScript from "./suite-script.ts";

export class TestTiming extends SuiteScript {
  private static readonly RUNS: number = 3;
  private static readonly FILE_BUDGET_MILLISECONDS: number = 2_000;
  private static readonly MARGIN: number = 0.5;
  private static readonly TIMING_FOLDER: string = "_build/timing";
  private static readonly README_PATH: string = "README.md";
  private static readonly SLOWER_FILES_HEADING: string = "Test files slower than the timing check's budget:";
  private static readonly SLOWER_FILE_ROW: RegExp = /^\| `([^`]+)` \| ([0-9]+) ms \|/u;
  private static readonly TABLE_ROW_PREFIX: string = "|";
  private static readonly BLANK_LINE: string = "";
  private static readonly LINE_END: RegExp = /\r?\n/u;
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

        await this.writeLogAsync(TestTiming.runFailed(run));
        process.exitCode = 1;
        return;
      }

      runs.push(testing.TestTimeRecord.parseAll(await this.readFileAsync(resultsFile)));
    }

    const timings = new testing.TestTimingCheck(TestTiming.FILE_BUDGET_MILLISECONDS, TestTiming.MARGIN, await this.readListedAsync()).judge(runs);
    for (const timing of timings.filter(t => t.isOver || t.isListed))
      await this.writeLogAsync(TestTiming.fileTiming(timing.file, timing.medianMilliseconds, timing.limitMilliseconds, timing.isOver));

    const over = timings.filter(t => t.isOver).length;
    await this.writeLogAsync(TestTiming.summary(timings.length, over));
    process.exitCode = over === 0 ? 0 : 1;
  }

  private async readListedAsync(): Promise<Map<string, number>> {
    const lines = (await this.readFileAsync(TestTiming.README_PATH)).split(TestTiming.LINE_END);
    const listed = new Map<string, number>();
    const start = lines.indexOf(TestTiming.SLOWER_FILES_HEADING);
    if (start === -1)
      return listed;

    for (const line of lines.slice(start + 1)) {
      if (!line.startsWith(TestTiming.TABLE_ROW_PREFIX)) {
        if (line === TestTiming.BLANK_LINE)
          continue;

        break;
      }

      const match = TestTiming.SLOWER_FILE_ROW.exec(line);
      if (match?.[1] !== undefined && match[2] !== undefined)
        listed.set(match[1], Number(match[2]));
    }

    return listed;
  }

  private static startingRun(run: number): string {
    return `Timing run ${run} of ${TestTiming.RUNS}...`;
  }

  private static runFailed(run: number): string {
    return `Timing run ${run} failed; the timing check judges only a passing suite.`;
  }

  private static fileTiming(file: string, medianMilliseconds: number | undefined, limitMilliseconds: number, isOver: boolean): string {
    const median = medianMilliseconds === undefined ? "not run" : `${Math.round(medianMilliseconds)} ms`;
    return `${isOver ? "Over" : "Within"}: ${file}, median ${median}, limit ${Math.round(limitMilliseconds)} ms.`;
  }

  private static summary(files: number, over: number): string {
    return `Timed ${files} test files over ${TestTiming.RUNS} runs; ${over} over their limit.`;
  }
}

const timing = new TestTiming();
await timing.runAsEntryPointAsync();
