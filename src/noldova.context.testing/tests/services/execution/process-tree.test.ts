/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";

import { Assert, TestClass, TestingException, TestMethod } from "@noldova/context.testing";
import { ProcessListing } from "@noldova/context.testing/models/execution/process-listing.js";
import { ProcessTree } from "@noldova/context.testing/services/execution/process-tree.js";

import { FakeClock } from "../../fixtures/execution/fake-clock.fixture.js";

@TestClass
export class ProcessTreeTests {
  private static readonly CHAIN_SCRIPT: string = "const depth = Number(process.argv[1]); const root = Number(process.argv[2] ?? process.pid); " +
    "console.log(process.pid); if (depth > 0) require(\"node:child_process\").spawnSync(process.execPath, " +
    "[...process.execArgv, String(depth - 1), String(root)], { stdio: \"inherit\" }); " +
    "else setInterval(() => { try { process.kill(root, 0); } catch { process.exit(); } }, 100);";
  private static readonly SLEEP_SCRIPT: string = "setTimeout(() => undefined, 30_000);";
  private static readonly COLD_SCRIPT: string = "console.log(\"5 1\\n21 5\\nend\");";
  private static readonly ANSWERING_SCRIPT: string = "console.log(\"ready\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
    ".on(\"line\", () => console.log(\"5 1\\n11 5\\n12 11\\nend\"));";
  private static readonly ROOTLESS_SCRIPT: string = "let answers = 0; console.log(\"ready\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
    ".on(\"line\", () => { answers++; console.log(answers >= Number(process.argv[1]) ? \"5 1\\n11 5\\nend\" : \"0 0\\nend\"); });";
  private static readonly ONCE_ROOTLESS_SCRIPT: string = "let answers = 0; console.log(\"ready\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
    ".on(\"line\", () => { answers++; if (answers === 1) console.log(\"0 0\\nend\"); });";
  private static readonly ROOTLESS_COLD_SCRIPT: string = "console.log(\"0 0\\nend\");";
  private static readonly SILENT_SCRIPT: string = "process.stdin.resume();";
  private static readonly ENDING_SCRIPT: string = "console.log(\"ready\"); process.stdin.once(\"data\", () => process.exit(1));";
  private static readonly MUTE_SCRIPT: string = "console.log(\"ready\"); process.stdin.resume();";
  private static readonly REFUSING_SCRIPT: string = "console.log(\"Script Host access is disabled on this machine.\");";
  private static readonly HANGING_SCRIPT: string = "setInterval(() => undefined, 1_000);";
  private static readonly SCRIPTED_LISTER: string = `if (process.argv[2] === "warm") { ${ProcessTreeTests.ANSWERING_SCRIPT} } else { console.log("5 1\\n21 5\\nend"); }`;
  private static readonly STUCK_SCRIPT: string = "require(\"node:child_process\").spawn(process.execPath, [\"--eval\", \"require(\\\"node:v8\\\").stopCoverage(); const fs = require(\\\"node:fs\\\"); fs.writeFileSync(process.argv[1] + \\\".started\\\", \\\"\\\"); setInterval(() => { if (!fs.existsSync(process.argv[1])) process.exit(); }, 50);\", process.argv[1]], { stdio: \"inherit\" }); setInterval(() => undefined, 1_000);";
  private static readonly STUCK_FOLDER_PREFIX: string = "context-stuck-listing-";
  private static readonly STOP_LIMIT_MILLISECONDS: number = 5_000;
  private static readonly PROCESS_HANDLE: string = "ProcessWrap";
  private static readonly UNUSED_PROCESS_ID: number = 2_147_483_647;
  private static readonly TEMPORARY_DIRECTORY_VARIABLES: readonly string[] = ["TMPDIR", "TEMP", "TMP"];

  @TestMethod
  public async listsTheDescendantsOfAProcessLeavesFirstAsync(): Promise<void> {
    const tree = await ProcessTreeTests.startWarmTreeAsync();
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const descendants = await tree.listDescendantsAsync(root.pid ?? -1);

      Assert.areEqual(`${processIds[2]},${processIds[1]}`, descendants.processIds.join());
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async endsTheDescendantsAProcessWaitsOnSoItReturnsAsync(): Promise<void> {
    const tree = await ProcessTreeTests.startWarmTreeAsync();
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const closed = once(root, "close");

      ProcessTree.end((await tree.listDescendantsAsync(root.pid ?? -1)).processIds);
      const [exitCode] = await closed;

      Assert.areEqual(0, exitCode);
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async listsTheDescendantsOfAProcessWithoutAWarmListerAsync(): Promise<void> {
    const tree = new ProcessTree(process.platform);
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const descendants = await tree.listDescendantsAsync(root.pid ?? -1);

      Assert.areEqual(`${processIds[2]},${processIds[1]}`, descendants.processIds.join());
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
      await ProcessTreeTests.closeAsync(tree);
    }
    Assert.isFalse(await tree.warming);
  }

  @TestMethod
  public async countsOnlyTheProcessesItEndsAsync(): Promise<void> {
    const error = Assert.throws(() => process.kill(ProcessTreeTests.UNUSED_PROCESS_ID, 0), Error);
    const sleeping = ProcessTreeTests.startNode(["--eval", ProcessTreeTests.SLEEP_SCRIPT]);
    const closed = once(sleeping, "close");

    const endedCount = ProcessTree.end([ProcessTreeTests.UNUSED_PROCESS_ID, sleeping.pid ?? -1]);
    await closed;

    Assert.areEqual("kill ESRCH", error.message);
    Assert.areEqual(1, endedCount);
  }

  @TestMethod
  public async listsWithItsWarmListerOnceItIsReadyAsync(): Promise<void> {
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.ANSWERING_SCRIPT));
    try {
      tree.warm();
      tree.warm();

      Assert.isTrue(await tree.warming);
      const descendants = await tree.listDescendantsAsync(5);
      Assert.areEqual("12,11", descendants.processIds.join());
      Assert.isTrue(descendants.isWarm);
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).processIds.join());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async listsAloneUntilItsListerIsReadyAsync(): Promise<void> {
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.SILENT_SCRIPT));
    try {
      tree.warm();

      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).processIds.join());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
    Assert.isFalse(await tree.warming);
  }

  @TestMethod
  public async listsAloneOnceItsListerHasEndedAsync(): Promise<void> {
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.ENDING_SCRIPT));
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);

      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).processIds.join());
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).processIds.join());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async listsAloneWhenItsListerDoesNotAnswerWithinItsLimitAsync(): Promise<void> {
    const clock = new FakeClock();
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.MUTE_SCRIPT), clock);
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);

      const listing = tree.listDescendantsAsync(5);
      clock.advance(4_999);
      clock.advance(1);

      const descendants = await listing;
      Assert.areEqual("21", descendants.processIds.join());
      Assert.isFalse(descendants.isWarm);
      Assert.areEqual(0, descendants.milliseconds);
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async failsAListingThatDoesNotAnswerWithinItsLimitAsync(): Promise<void> {
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.HANGING_SCRIPT], "missing-lister", [])]]);
    const tree = new ProcessTree("fake", listings, clock);
    let isSettled = false;
    const listing = tree.listDescendantsAsync(5);
    listing.then(() => { isSettled = true; }, () => { isSettled = true; });

    await setImmediate();
    clock.advance(59_999);
    await setImmediate();
    const isSettledBeforeTheLimit = isSettled;
    clock.advance(1);
    const error = await Assert.throwsAsync(() => listing, TestingException);
    await ProcessTreeTests.closeAsync(tree);

    Assert.isFalse(isSettledBeforeTheLimit);
    Assert.areEqual(`The run could not list the processes running under it with ${process.execPath} within 60000 milliseconds.`, error.message);
  }

  @TestMethod
  public async failsAListingThatEndsWithoutItsEndLineAsync(): Promise<void> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.REFUSING_SCRIPT], "missing-lister", [])]]);
    const tree = new ProcessTree("fake", listings);

    const error = await Assert.throwsAsync(() => tree.listDescendantsAsync(5), TestingException);
    await ProcessTreeTests.closeAsync(tree);

    Assert.areEqual(`The run could not list the processes running under it with ${process.execPath}, which ended without finishing its listing ` +
      "and wrote: \"Script Host access is disabled on this machine.\".", error.message);
  }

  @TestMethod
  public async runsItsListersFromAScriptItRemovesOnCloseAsync(): Promise<void> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["<listing script>"], process.execPath, ["<listing script>", "warm"], ProcessTreeTests.SCRIPTED_LISTER)]]);
    const tree = new ProcessTree("fake", listings);
    const foldersBefore = await ProcessTreeTests.listScriptFoldersAsync();
    let foldersWhileOpen: string[];
    try {
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).processIds.join());
      tree.warm();
      Assert.isTrue(await tree.warming);
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).processIds.join());
      foldersWhileOpen = await ProcessTreeTests.listScriptFoldersAsync();
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
    const foldersAfter = await ProcessTreeTests.listScriptFoldersAsync();

    Assert.areEqual(foldersBefore.length + 1, foldersWhileOpen.length);
    Assert.areEqual(foldersBefore.join(), foldersAfter.join());
  }

  @TestMethod
  public async failsAListingWhoseScriptItCannotWriteAsync(): Promise<void> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["<listing script>"], process.execPath, ["<listing script>", "warm"], ProcessTreeTests.SCRIPTED_LISTER)]]);
    const tree = new ProcessTree("fake", listings);
    const missingDirectory = join(tmpdir(), "missing-parent", "missing");
    const values = ProcessTreeTests.TEMPORARY_DIRECTORY_VARIABLES.map(t => process.env[t]);
    let error: TestingException;
    try {
      for (const variable of ProcessTreeTests.TEMPORARY_DIRECTORY_VARIABLES)
        process.env[variable] = missingDirectory;
      tree.warm();
      error = await Assert.throwsAsync(() => tree.listDescendantsAsync(5), TestingException);
    }
    finally {
      ProcessTreeTests.TEMPORARY_DIRECTORY_VARIABLES.forEach((variable, index) => ProcessTreeTests.restoreVariable(variable, values[index]));
      await ProcessTreeTests.closeAsync(tree);
    }

    Assert.isFalse(await tree.warming);
    Assert.areEqual(`The run could not list the processes running under it with ${process.execPath}.`, error.message);
    Assert.isTrue(String(error.cause).includes("ENOENT"), String(error.cause));
  }

  @TestMethod
  public async listsAloneWhenItsListerCannotStartAsync(): Promise<void> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.COLD_SCRIPT], "missing-lister", [])]]);
    const tree = new ProcessTree("fake", listings);
    try {
      tree.warm();

      Assert.isFalse(await tree.warming);
      const descendants = await tree.listDescendantsAsync(5);
      Assert.areEqual("21", descendants.processIds.join());
      Assert.isFalse(descendants.isWarm);
      Assert.areEqual(2, descendants.listedCount);
      Assert.isUndefined(descendants.brokenChains);
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async linksAProcessToItsParentOnlyWhenItStartedAfterItAndSkipsOtherLinesAsync(): Promise<void> {
    const tree = ProcessTreeTests.startOneOffTree(["PID PPID START NAME", "5 1 100", "11 5 102", "12 11 101", "13 5"]);
    try {
      const descendants = await tree.listDescendantsAsync(5);

      Assert.areEqual("11,13", descendants.processIds.join());
      Assert.areEqual(4, descendants.listedCount);
      Assert.areEqual("12 under 11, gone or reused", descendants.brokenChains?.join("; "));
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async linksNoProcessWithAStartTimeToAParentWithoutOneAsync(): Promise<void> {
    const tree = ProcessTreeTests.startOneOffTree(["5 1 100", "13 5", "14 13 105"]);
    try {
      const descendants = await tree.listDescendantsAsync(5);

      Assert.areEqual("13", descendants.processIds.join());
      Assert.areEqual("14 under 13, gone or reused", descendants.brokenChains?.join("; "));
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async listsAgainWhenAListingLeavesOutTheRootAsync(): Promise<void> {
    const clock = new FakeClock();
    clock.fireOnceArmed(2, 4);
    const tree = await ProcessTreeTests.startRootlessTreeAsync(3, clock);
    try {
      const descendants = await tree.listDescendantsAsync(5);

      Assert.areEqual("11", descendants.processIds.join());
      Assert.isTrue(descendants.isWarm);
      Assert.areEqual("warm, 0 ms, 1 listed; warm, 0 ms, 1 listed", descendants.incompleteListings.join("; "));
      Assert.isTrue(descendants.describe().endsWith(" Listings before it that left out the run's own process: 2 (warm, 0 ms, 1 listed; warm, 0 ms, 1 listed)."),
        descendants.describe());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async failsNamingItsListingsWhenEachLeavesOutTheRootAsync(): Promise<void> {
    const clock = new FakeClock();
    clock.fireOnceArmed(2, 4);
    const tree = await ProcessTreeTests.startRootlessTreeAsync(4, clock);
    try {
      const error = await Assert.throwsAsync(() => tree.listDescendantsAsync(5), TestingException);

      Assert.areEqual("The run's process listings left out process 5, whose descendants they were to list, so each was incomplete; " +
        "listings made: 3 (warm, 0 ms, 1 listed; warm, 0 ms, 1 listed; warm, 0 ms, 1 listed).", error.message);
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async waitsAPauseBeforeListingAgainAsync(): Promise<void> {
    const clock = new FakeClock();
    const tree = await ProcessTreeTests.startRootlessTreeAsync(2, clock);
    try {
      const listing = tree.listDescendantsAsync(5);
      while (clock.latestTimer < 2)
        await setImmediate();
      clock.advance(999);
      await setImmediate();
      const timersWithinThePause = clock.latestTimer;
      clock.advance(1);
      const descendants = await listing;

      Assert.areEqual(2, timersWithinThePause);
      Assert.areEqual("11", descendants.processIds.join());
      Assert.areEqual(1_000, clock.now());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async failsWhenASlowListingLeavesNoTimeForAnotherAsync(): Promise<void> {
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.ROOTLESS_COLD_SCRIPT], process.execPath,
      ["--eval", ProcessTreeTests.MUTE_SCRIPT])]]);
    const tree = new ProcessTree("fake", listings, clock);
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);
      const listing = tree.listDescendantsAsync(5);
      clock.advance(5_000);
      await setImmediate();
      clock.advance(59_500);
      const error = await Assert.throwsAsync(() => listing, TestingException);

      Assert.areEqual("The run's process listings left out process 5, whose descendants they were to list, so each was incomplete; " +
        "listings made: 1 (one-off, 59500 ms, 1 listed).", error.message);
      Assert.areEqual(64_500, clock.now());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async limitsALaterListingToWhatIsLeftOfItsDeadlineAsync(): Promise<void> {
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.HANGING_SCRIPT], process.execPath,
      ["--eval", ProcessTreeTests.ONCE_ROOTLESS_SCRIPT])]]);
    const tree = new ProcessTree("fake", listings, clock);
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);
      const listing = tree.listDescendantsAsync(5);
      let isSettled = false;
      listing.then(() => { isSettled = true; }, () => { isSettled = true; });
      while (clock.latestTimer < 2)
        await setImmediate();
      clock.advance(1_000);
      await setImmediate();
      clock.advance(5_000);
      await setImmediate();
      clock.advance(58_999);
      await setImmediate();
      const isSettledBeforeTheDeadline = isSettled;
      clock.advance(1);
      const error = await Assert.throwsAsync(() => listing, TestingException);

      Assert.isFalse(isSettledBeforeTheDeadline);
      Assert.areEqual(`The run could not list the processes running under it with ${process.execPath} within 59000 milliseconds.`, error.message);
      Assert.areEqual(65_000, clock.now());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async leavesNoProcessHandleOpenOnceItHasClosedAsync(): Promise<void> {
    const handlesBefore = ProcessTreeTests.countProcessHandles();
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.ANSWERING_SCRIPT));
    try {
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).processIds.join());
      tree.warm();
      Assert.isTrue(await tree.warming);
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).processIds.join());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }

    Assert.areEqual(handlesBefore, ProcessTreeTests.countProcessHandles());
  }

  @TestMethod
  public async waitsForAListingThatTimedOutToEndBeforeItHasClosedAsync(): Promise<void> {
    const handlesBefore = ProcessTreeTests.countProcessHandles();
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.HANGING_SCRIPT], "missing-lister", [])]]);
    const tree = new ProcessTree("fake", listings, clock);
    const listing = tree.listDescendantsAsync(5);
    await setImmediate();
    clock.advance(60_000);
    await Assert.throwsAsync(() => listing, TestingException);

    await ProcessTreeTests.closeAsync(tree);

    Assert.areEqual(handlesBefore, ProcessTreeTests.countProcessHandles());
  }

  @TestMethod
  public async failsNamingItsListingsWhenNoTimeIsLeftForAOneOffListingAsync(): Promise<void> {
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.HANGING_SCRIPT], process.execPath,
      ["--eval", ProcessTreeTests.ONCE_ROOTLESS_SCRIPT])]]);
    const tree = new ProcessTree("fake", listings, clock);
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);
      const listing = tree.listDescendantsAsync(5);
      while (clock.latestTimer < 2)
        await setImmediate();
      clock.advance(61_000);
      await setImmediate();
      clock.advance(4_000);
      const error = await Assert.throwsAsync(() => listing, TestingException);

      Assert.areEqual("The run's process listings left out process 5, whose descendants they were to list, so each was incomplete; " +
        "listings made: 1 (warm, 0 ms, 1 listed).", error.message);
      Assert.areEqual(65_000, clock.now());
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async failsToCloseWithinItsLimitWhileAListingWillNotEndAsync(): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), ProcessTreeTests.STUCK_FOLDER_PREFIX));
    const hold = join(folder, "hold");
    await writeFile(hold, "");
    const clock = new FakeClock();
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.STUCK_SCRIPT, hold], "missing-lister", [])]]);
    const tree = new ProcessTree("fake", listings, clock);
    try {
      const listing = tree.listDescendantsAsync(5);
      while (!(await readdir(folder)).includes("hold.started"))
        await setImmediate();
      clock.advance(60_000);
      await Assert.throwsAsync(() => listing, TestingException);
      const failures: string[] = [];
      let isSettled = false;
      const closing = tree.closeAsync(ProcessTreeTests.STOP_LIMIT_MILLISECONDS, error => failures.push(error.message));
      closing.then(() => { isSettled = true; }, () => { isSettled = true; });
      clock.advance(ProcessTreeTests.STOP_LIMIT_MILLISECONDS - 1);
      await setImmediate();
      const isSettledBeforeTheLimit = isSettled;
      const failuresBeforeTheLimit = failures.length;
      clock.advance(1);
      const isClosed = await closing;

      Assert.isFalse(isSettledBeforeTheLimit);
      Assert.areEqual(0, failuresBeforeTheLimit);
      Assert.isFalse(isClosed);
      Assert.areEqual(`The run could not end its process listings within 5000 milliseconds of stopping them; still open: ${process.execPath}.`, failures.join());
    }
    finally {
      await rm(hold, { force: true });
      await ProcessTreeTests.closeAsync(tree);
      await rm(folder, { recursive: true, force: true });
    }
  }

  @TestMethod
  public async namesTheProcessesStartedAfterTheRunUnderAParentThatHasGoneAsync(): Promise<void> {
    const tree = ProcessTreeTests.startOneOffTree(["5 1 100", "30 99 105", "31 30 106", "40 5 107", "50 60 108", "60 1 109", "1 0 001", "70 8 110", "8 1 090"]);
    try {
      const descendants = await tree.listDescendantsAsync(5);

      Assert.areEqual("40", descendants.processIds.join());
      Assert.areEqual(9, descendants.listedCount);
      Assert.areEqual("30 under 99, gone or reused; 31 under 30 under 99, gone or reused; 50 under 60, gone or reused", descendants.brokenChains?.join("; "));
    }
    finally {
      await ProcessTreeTests.closeAsync(tree);
    }
  }

  @TestMethod
  public async rejectsAPlatformItCannotListAsync(): Promise<void> {
    const tree = new ProcessTree("aix");
    tree.warm();

    const error = await Assert.throwsAsync(() => tree.listDescendantsAsync(5), TestingException);
    await ProcessTreeTests.closeAsync(tree);

    Assert.isFalse(await tree.warming);
    Assert.areEqual("The run cannot list the processes running under it on aix.", error.message);
  }

  private static async startChainAsync(): Promise<[ChildProcess, number[]]> {
    const root = ProcessTreeTests.startNode(["--eval", ProcessTreeTests.CHAIN_SCRIPT, "2"]);
    const processIds: number[] = [];
    for await (const chunk of root.stdout ?? []) {
      processIds.push(...String(chunk).split(/\s+/u).filter(t => t.length > 0).map(Number));
      if (processIds.length === 3)
        break;
    }

    return [root, processIds];
  }

  private static async endChainAsync(root: ChildProcess, processIds: readonly number[]): Promise<void> {
    if (Object.isNull(root.exitCode) && Object.isNull(root.signalCode)) {
      const closed = once(root, "close");
      ProcessTree.end([...processIds].reverse());
      await closed;
    }
  }

  private static async startWarmTreeAsync(): Promise<ProcessTree> {
    const tree = new ProcessTree(process.platform);
    tree.warm();
    Assert.isTrue(await tree.warming);
    return tree;
  }

  private static async listScriptFoldersAsync(): Promise<string[]> {
    return (await readdir(tmpdir())).filter(t => t.startsWith("noldova-process-listing-")).sort();
  }

  private static restoreVariable(variable: string, value: string | undefined): void {
    if (Object.isUndefined(value))
      Reflect.deleteProperty(process.env, variable);
    else
      process.env[variable] = value;
  }

  private static async closeAsync(tree: ProcessTree): Promise<void> {
    Assert.isTrue(await tree.closeAsync(ProcessTreeTests.STOP_LIMIT_MILLISECONDS, error => { throw error; }));
  }

  private static countProcessHandles(): number {
    return process.getActiveResourcesInfo().filter(t => t === ProcessTreeTests.PROCESS_HANDLE).length;
  }

  private static startOneOffTree(rows: readonly string[]): ProcessTree {
    const script = `console.log(${JSON.stringify([...rows, "end"].join("\n"))});`;
    return new ProcessTree("fake", new Map([["fake", new ProcessListing(process.execPath, ["--eval", script], "missing-lister", [])]]));
  }

  private static async startRootlessTreeAsync(completeFrom: number, clock: FakeClock): Promise<ProcessTree> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.COLD_SCRIPT], process.execPath,
      ["--eval", ProcessTreeTests.ROOTLESS_SCRIPT, String(completeFrom)])]]);
    const tree = new ProcessTree("fake", listings, clock);
    tree.warm();
    Assert.isTrue(await tree.warming);
    return tree;
  }

  private static fakeListings(warmScript: string): ReadonlyMap<string, ProcessListing> {
    return new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.COLD_SCRIPT], process.execPath, ["--eval", warmScript])]]);
  }

  private static startNode(arguments_: readonly string[]): ChildProcess {
    const environment = { ...process.env };
    delete environment["NODE_V8_COVERAGE"];
    return spawn(process.execPath, arguments_, { env: environment, stdio: ["ignore", "pipe", "inherit"], shell: false });
  }
}
