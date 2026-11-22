/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";

import { ProcessesException } from "@noldova/context.processes";
import { ProcessListing } from "@noldova/context.processes/models/process-listing.js";
import { ProcessSignals } from "@noldova/context.processes/models/process-signals.js";
import { ProcessLister } from "@noldova/context.processes/services/process-lister.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessListerTests {
  private static readonly STOP_COVERAGE: string = "require(\"node:v8\").stopCoverage(); ";
  private static readonly READY_MILLISECONDS: number = 10_000;
  private static readonly PROCESS_HANDLE: string = "ProcessWrap";
  private static readonly PIPE_HANDLE: string = "PipeWrap";
  private static readonly FOLDER_PREFIX: string = "context-lister-";
  private static readonly ANSWERING_SCRIPT: string = "let answers = 0; console.log(\"end\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
    ".on(\"line\", () => { answers++; console.log(process.ppid + \" 1 0 R \" + answers); console.log(\"end\"); });";
  private static readonly REFUSAL: string = "Cannot create type. Only core types are supported in this language mode.";

  @TestMethod
  public async listsAgainWhenAListingLeavesOutItsCallerAsync(): Promise<void> {
    const entries = await ProcessLister.useAsync(10_000, t => t.listAsync(), ProcessListerTests.answering(2));

    Assert.areEqual(1, entries.length);
    Assert.areEqual(process.pid, entries[0]?.processId);
    Assert.areEqual(2, entries[0]?.startTime);
  }

  @TestMethod
  public async throwsNamingItsListingsWhenEachLeavesOutItsCallerAsync(): Promise<void> {
    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(10_000, t => t.listAsync(), ProcessListerTests.answering(Infinity)), ProcessesException);

    Assert.areEqual(`The process lister "${process.execPath}" left the process that called it out of every listing, so each was incomplete; listings made: 3.`,
      error.message);
  }

  @TestMethod
  public async listsOnceWhenItsLimitHasPassedAsync(): Promise<void> {
    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(0, t => t.listAsync(), ProcessListerTests.answering(Infinity)), ProcessesException);

    Assert.isTrue(error.message.endsWith("listings made: 1."), error.message);
  }

  @TestMethod
  public async keepsOneListerForEveryCallAsync(): Promise<void> {
    const listings = ProcessListerTests.answering(1);

    const first = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);
    const second = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);

    Assert.areEqual(1, first[0]?.startTime);
    Assert.areEqual(2, second[0]?.startTime);
  }

  @TestMethod
  public async startsAnotherListerOnceItsListerHasEndedAsync(): Promise<void> {
    const listings = ProcessListerTests.fakeListings("let answers = 0; console.log(\"end\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
      ".on(\"line\", () => { answers++; if (answers === 2) process.exit(0); console.log(process.ppid + \" 1 0 R \" + answers); console.log(\"end\"); });",
    ProcessListerTests.READY_MILLISECONDS);

    const first = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);
    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(10_000, t => t.listAsync(), listings), ProcessesException);
    const third = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);

    Assert.areEqual(1, first[0]?.startTime);
    Assert.areEqual(`The process lister "${process.execPath}" ended before it answered.`, error.message);
    Assert.areEqual(1, third[0]?.startTime);
  }

  @TestMethod
  public async endsAListerThatDoesNotAnswerWithinTheCallsLimitAsync(): Promise<void> {
    const listings = ProcessListerTests.fakeListings("console.log(\"end\"); process.stdin.resume();", ProcessListerTests.READY_MILLISECONDS);

    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(0, t => t.listAsync(), listings), ProcessesException);

    Assert.areEqual(`The process lister "${process.execPath}" ended before it answered.`, error.message);
  }

  @TestMethod
  public async throwsWhenItsListerIsNotReadyWithinItsOwnLimitAsync(): Promise<void> {
    const handlesBefore = ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE);
    const listings = ProcessListerTests.fakeListings("process.stdin.resume();", 100);

    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(10_000, t => t.listAsync(), listings), ProcessesException);

    Assert.areEqual(`The process lister "${process.execPath}" was not ready within 100 ms.`, error.message);
    Assert.areEqual(handlesBefore, ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE));
  }

  @TestMethod
  public async throwsSayingTheMachineRefusedItsListingAsync(): Promise<void> {
    const handlesBefore = ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE);
    const listings = ProcessListerTests.fakeListings(`console.log("refused ${ProcessListerTests.REFUSAL}"); process.exit(1);`, ProcessListerTests.READY_MILLISECONDS);

    const error = await Assert.throwsAsync(() => ProcessLister.useAsync(10_000, t => t.listAsync(), listings), ProcessesException);

    Assert.areEqual(`The process lister "${process.execPath}" could not set up its listing, as the machine refused it: ${ProcessListerTests.REFUSAL}`, error.message);
    Assert.areEqual(handlesBefore, ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE));
  }

  @TestMethod
  public async keepsTheListerStartedWhileAFailedStartEndsAsync(): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), ProcessListerTests.FOLDER_PREFIX));
    try {
      const refusedOnce = JSON.stringify(join(folder, "refused"));
      const hold = join(folder, "hold");
      const holding = `const wait = () => require("node:fs").existsSync(${JSON.stringify(hold)}) ? setTimeout(wait, 10) : undefined; wait();`;
      const listings = ProcessListerTests.fakeListings(`if (!require("node:fs").existsSync(${refusedOnce})) { require("node:fs").writeFileSync(${refusedOnce}, ""); ` +
        `require("node:child_process").spawn(process.execPath, ["-e", ${JSON.stringify(holding)}], { stdio: ["ignore", "inherit", "ignore"] }); ` +
        `console.log("refused ${ProcessListerTests.REFUSAL}"); process.exit(1); } ${ProcessListerTests.ANSWERING_SCRIPT}`, ProcessListerTests.READY_MILLISECONDS);
      await writeFile(hold, "");
      const processesBefore = ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE);
      const pipesBefore = ProcessListerTests.countHandles(ProcessListerTests.PIPE_HANDLE);
      let isFailedSettled = false;
      const failed = ProcessLister.useAsync(10_000, t => t.listAsync(), listings);
      failed.catch(() => undefined).finally(() => {
        isFailedSettled = true;
      });
      while (ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE) === processesBefore)
        await setImmediate();
      while (ProcessListerTests.countHandles(ProcessListerTests.PROCESS_HANDLE) > processesBefore)
        await setImmediate();
      await rm(hold);
      while (ProcessListerTests.countHandles(ProcessListerTests.PIPE_HANDLE) > pipesBefore)
        await setImmediate();

      const isFailedSettledAtSecondStart = isFailedSettled;
      const second = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);
      await Assert.throwsAsync(() => failed, ProcessesException);
      const third = await ProcessLister.useAsync(10_000, t => t.listAsync(), listings);

      Assert.isFalse(isFailedSettledAtSecondStart);
      Assert.areEqual(1, second[0]?.startTime);
      Assert.areEqual(2, third[0]?.startTime);
    }
    finally {
      await rm(folder, { recursive: true, force: true });
    }
  }

  private static countHandles(type: string): number {
    return process.getActiveResourcesInfo().filter(t => t === type).length;
  }

  private static answering(completeFrom: number): ReadonlyMap<string, ProcessListing> {
    return ProcessListerTests.fakeListings("let answers = 0; console.log(\"end\"); require(\"node:readline\").createInterface({ input: process.stdin }).on(\"line\", () => { answers++; " +
      `if (answers >= ${completeFrom}) console.log(process.ppid + " 1 0 R " + answers); console.log("end"); });`, ProcessListerTests.READY_MILLISECONDS);
  }

  private static fakeListings(script: string, readyMilliseconds: number): ReadonlyMap<string, ProcessListing> {
    const signals = new ProcessSignals("SIGSTOP", "SIGCONT", "SIGTERM", "SIGKILL");
    return new Map([[process.platform, new ProcessListing(process.execPath, [], "list-processes.cjs", ProcessListerTests.STOP_COVERAGE + script, signals, 1,
      readyMilliseconds)]]);
  }
}
