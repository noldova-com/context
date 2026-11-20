/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";

import { Assert, TestClass, TestingException, TestMethod } from "@noldova/context.testing";
import { ProcessTree } from "@noldova/context.testing/services/execution/process-tree.js";

@TestClass
export class ProcessTreeTests {
  private static readonly CHAIN_SCRIPT: string = "const depth = Number(process.argv[1]); console.log(process.pid); " +
    "if (depth > 0) require(\"node:child_process\").spawnSync(process.execPath, [...process.execArgv, String(depth - 1)], { stdio: \"inherit\" }); " +
    "else setTimeout(() => undefined, 30_000);";
  private static readonly SLEEP_SCRIPT: string = "setTimeout(() => undefined, 30_000);";

  @TestMethod
  public async listsTheDescendantsOfAProcessLeavesFirstAsync(): Promise<void> {
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const descendants = await new ProcessTree(process.platform).listDescendantsAsync(root.pid ?? -1);

      Assert.areEqual(`${processIds[2]},${processIds[1]}`, descendants.join());
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
    }
  }

  @TestMethod
  public async endsTheDescendantsAProcessWaitsOnSoItReturnsAsync(): Promise<void> {
    const [root, processIds] = await ProcessTreeTests.startChainAsync();
    try {
      const closed = once(root, "close");

      ProcessTree.end(await new ProcessTree(process.platform).listDescendantsAsync(root.pid ?? -1));
      const [exitCode] = await closed;

      Assert.areEqual(0, exitCode);
    }
    finally {
      await ProcessTreeTests.endChainAsync(root, processIds);
    }
  }

  @TestMethod
  public async countsOnlyTheProcessesItEndsAsync(): Promise<void> {
    const exited = ProcessTreeTests.startNode(["--eval", String.empty]);
    await once(exited, "close");
    const sleeping = ProcessTreeTests.startNode(["--eval", ProcessTreeTests.SLEEP_SCRIPT]);
    const closed = once(sleeping, "close");

    const endedCount = ProcessTree.end([exited.pid ?? -1, sleeping.pid ?? -1]);
    await closed;

    Assert.areEqual(1, endedCount);
  }

  @TestMethod
  public rejectsAPlatformItCannotList(): void {
    const error = Assert.throws(() => new ProcessTree("aix"), TestingException);

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

  private static startNode(arguments_: readonly string[]): ChildProcess {
    const environment = { ...process.env };
    delete environment["NODE_V8_COVERAGE"];
    return spawn(process.execPath, arguments_, { env: environment, stdio: ["ignore", "pipe", "inherit"], shell: false });
  }
}
