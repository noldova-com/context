/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { once } from "node:events";

import "@noldova/context.core";
import { Processes, ProcessIdentity } from "@noldova/context.processes";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessesTests {
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly EXIT_EVENT: string = "exit";
  private static readonly WINDOWS: string = "win32";

  @TestMethod
  public async listsItsOwnProcessWithItsParentGroupAndIdentityAsync(): Promise<void> {
    const identity = await ProcessIdentity.readAsync(process.pid);

    const own = (await Processes.listAsync()).firstOrDefault(t => t.processId === process.pid);

    Assert.isDefined(identity);
    Assert.isDefined(own);
    Assert.areEqual(process.ppid, own.parentId);
    Assert.areEqual(process.platform === ProcessesTests.WINDOWS, Object.isNull(own.groupId));
    Assert.isFalse(own.isZombie);
    Assert.areEqual(identity.startTime, own.identity.startTime);
  }

  @TestMethod
  public async listsAChildItStartedUnderItsOwnIdAsync(): Promise<void> {
    const environment = { ...process.env };
    delete environment[ProcessesTests.COVERAGE_VARIABLE];
    const child = spawn(process.execPath, ["--eval", "process.stdin.resume();"], { env: environment, stdio: ["pipe", "ignore", "ignore"], windowsHide: true });
    try {
      const listed = (await Processes.listAsync()).firstOrDefault(t => t.processId === child.pid);

      Assert.isDefined(listed);
      Assert.areEqual(process.pid, listed.parentId);
    }
    finally {
      child.kill();
      await once(child, ProcessesTests.EXIT_EVENT);
    }
  }

  @TestMethod
  public async listsNoProcessWithIdZeroAsync(): Promise<void> {
    const processes = await Processes.listAsync();

    Assert.isTrue(processes.any(t => t.processId === process.pid));
    Assert.isFalse(processes.any(t => t.processId === 0));
  }
}
