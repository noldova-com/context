/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";

import { Assert, TestClass, TestingException, TestMethod, Timeout } from "@noldova/context.testing";
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
  private static readonly COLD_SCRIPT: string = "console.log(\"21 5\");";
  private static readonly ANSWERING_SCRIPT: string = "console.log(\"ready\"); require(\"node:readline\").createInterface({ input: process.stdin })" +
    ".on(\"line\", () => console.log(\"11 5\\n12 11\\nend\"));";
  private static readonly SILENT_SCRIPT: string = "process.stdin.resume();";
  private static readonly ENDING_SCRIPT: string = "console.log(\"ready\"); process.stdin.once(\"data\", () => process.exit(1));";
  private static readonly MUTE_SCRIPT: string = "console.log(\"ready\"); process.stdin.resume();";
  private static readonly HANGING_SCRIPT: string = "setInterval(() => undefined, 1_000);";
  private static readonly SCRIPTED_LISTER: string = `if (process.argv[2] === "warm") { ${ProcessTreeTests.ANSWERING_SCRIPT} } else { console.log("21 5"); }`;
  private static readonly UNUSED_PROCESS_ID: number = 2_147_483_647;
  private static readonly TEMPORARY_DIRECTORY_VARIABLES: readonly string[] = ["TMPDIR", "TEMP", "TMP"];

  @Timeout(60_000)
  @TestMethod
  public async listsTheDescendantsOfAProcessLeavesFirstAsync(): Promise<void> {
    const tree = await ProcessTreeTests.startWarmTreeAsync();
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const descendants = await tree.listDescendantsAsync(root.pid ?? -1);

      Assert.areEqual(`${processIds[2]},${processIds[1]}`, descendants.join());
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
      await tree.closeAsync();
    }
  }

  @Timeout(60_000)
  @TestMethod
  public async endsTheDescendantsAProcessWaitsOnSoItReturnsAsync(): Promise<void> {
    const tree = await ProcessTreeTests.startWarmTreeAsync();
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const closed = once(root, "close");

      ProcessTree.end(await tree.listDescendantsAsync(root.pid ?? -1));
      const [exitCode] = await closed;

      Assert.areEqual(0, exitCode);
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
      await tree.closeAsync();
    }
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
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).join());
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).join());
    }
    finally {
      await tree.closeAsync();
    }
  }

  @TestMethod
  public async listsAloneUntilItsListerIsReadyAsync(): Promise<void> {
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.SILENT_SCRIPT));
    try {
      tree.warm();

      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).join());
    }
    finally {
      await tree.closeAsync();
    }
    Assert.isFalse(await tree.warming);
  }

  @TestMethod
  public async listsAloneOnceItsListerHasEndedAsync(): Promise<void> {
    const tree = new ProcessTree("fake", ProcessTreeTests.fakeListings(ProcessTreeTests.ENDING_SCRIPT));
    try {
      tree.warm();
      Assert.isTrue(await tree.warming);

      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).join());
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).join());
    }
    finally {
      await tree.closeAsync();
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

      Assert.areEqual("21", (await listing).join());
    }
    finally {
      await tree.closeAsync();
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
    await tree.closeAsync();

    Assert.isFalse(isSettledBeforeTheLimit);
    Assert.areEqual(`The run could not list the processes running under it with ${process.execPath} within 60000 milliseconds.`, error.message);
  }

  @TestMethod
  public async runsItsListersFromAScriptItRemovesOnCloseAsync(): Promise<void> {
    const listings = new Map([["fake", new ProcessListing(process.execPath, ["<listing script>"], process.execPath, ["<listing script>", "warm"], ProcessTreeTests.SCRIPTED_LISTER)]]);
    const tree = new ProcessTree("fake", listings);
    const foldersBefore = await ProcessTreeTests.listScriptFoldersAsync();
    let foldersWhileOpen: string[];
    try {
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).join());
      tree.warm();
      Assert.isTrue(await tree.warming);
      Assert.areEqual("12,11", (await tree.listDescendantsAsync(5)).join());
      foldersWhileOpen = await ProcessTreeTests.listScriptFoldersAsync();
    }
    finally {
      await tree.closeAsync();
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
      await tree.closeAsync();
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
      Assert.areEqual("21", (await tree.listDescendantsAsync(5)).join());
    }
    finally {
      await tree.closeAsync();
    }
  }

  @TestMethod
  public async rejectsAPlatformItCannotListAsync(): Promise<void> {
    const tree = new ProcessTree("aix");
    tree.warm();

    const error = await Assert.throwsAsync(() => tree.listDescendantsAsync(5), TestingException);
    await tree.closeAsync();

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

  private static fakeListings(warmScript: string): ReadonlyMap<string, ProcessListing> {
    return new Map([["fake", new ProcessListing(process.execPath, ["--eval", ProcessTreeTests.COLD_SCRIPT], process.execPath, ["--eval", warmScript])]]);
  }

  private static startNode(arguments_: readonly string[]): ChildProcess {
    const environment = { ...process.env };
    delete environment["NODE_V8_COVERAGE"];
    return spawn(process.execPath, arguments_, { env: environment, stdio: ["ignore", "pipe", "inherit"], shell: false });
  }
}
