/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { spawn } from "node:child_process";
import { once } from "node:events";

import { ArgumentOutOfRangeException } from "@noldova/context.exceptions";
import { Processes, ProcessIdentity } from "@noldova/context.processes";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class ProcessIdentityTests {
  private static readonly COVERAGE_VARIABLE: string = "NODE_V8_COVERAGE";
  private static readonly EXIT_EVENT: string = "exit";
  private static readonly SPAWN_EVENT: string = "spawn";
  private static readonly DATA_EVENT: string = "data";
  private static readonly WINDOWS_PLATFORM: string = "win32";
  private static readonly SHELL: string = "/bin/sh";
  private static readonly UNREAPED_CHILD_SCRIPT: string = "sleep 0 & echo $!; exec sleep 60";
  private static readonly ZOMBIE_LIMIT_MILLISECONDS: number = 30_000;

  @TestMethod
  public keepsTheIdAndTheStartTime(): void {
    const identity = new ProcessIdentity(42, 1_763_806_000_000);

    Assert.areEqual(42, identity.processId);
    Assert.areEqual(1_763_806_000_000, identity.startTime);
  }

  @TestData(0, 0, "processId")
  @TestData(1.5, 0, "processId")
  @TestData(1, -1, "startTime")
  @TestData(1, 0.5, "startTime")
  @TestMethod
  public refusesAnIdOrAStartTimeOutOfRange(processId: number, startTime: number, parameterName: string): void {
    const error = Assert.throws(() => new ProcessIdentity(processId, startTime), ArgumentOutOfRangeException);

    Assert.areEqual(parameterName, error.parameterName);
  }

  @TestMethod
  public async readsTheIdentityOfItsOwnProcessAsync(): Promise<void> {
    const before = Date.now();

    const identity = await ProcessIdentity.readAsync(process.pid);

    Assert.isDefined(identity);
    Assert.areEqual(process.pid, identity.processId);
    Assert.isTrue(identity.startTime <= before);
    Assert.isTrue(identity.startTime > before - process.uptime() * 1000 - 2000);
  }

  @TestMethod
  public async readsNothingOfAProcessThatEndedAsync(): Promise<void> {
    const environment = { ...process.env };
    delete environment[ProcessIdentityTests.COVERAGE_VARIABLE];
    const child = spawn(process.execPath, ["--eval", "process.stdin.resume()"],
      { env: environment, stdio: ["pipe", "ignore", "ignore"], windowsHide: true });
    await once(child, ProcessIdentityTests.SPAWN_EVENT);
    const running = await ProcessIdentity.readAsync(child.pid ?? 0);
    Assert.isDefined(running);
    child.stdin.end();
    await once(child, ProcessIdentityTests.EXIT_EVENT);

    const ended = await ProcessIdentity.readAsync(running.processId);

    Assert.isTrue(Object.isUndefined(ended) || ended.startTime !== running.startTime);
  }

  @TestMethod
  public async readsNothingOfAnEndedProcessItsParentHasNotReapedAsync(): Promise<void> {
    if (process.platform === ProcessIdentityTests.WINDOWS_PLATFORM)
      return;

    const parent = spawn(ProcessIdentityTests.SHELL, ["-c", ProcessIdentityTests.UNREAPED_CHILD_SCRIPT],
      { stdio: ["ignore", "pipe", "ignore"] });
    try {
      const [output] = await once(parent.stdout, ProcessIdentityTests.DATA_EVENT);
      const processId = Number(String(output).trim());
      const deadline = performance.now() + ProcessIdentityTests.ZOMBIE_LIMIT_MILLISECONDS;
      while (!(await Processes.listAsync()).any(t => t.processId === processId && t.isZombie))
        Assert.isTrue(performance.now() < deadline, String(processId));

      Assert.isUndefined(await ProcessIdentity.readAsync(processId));
    }
    finally {
      parent.kill();
      await once(parent, ProcessIdentityTests.EXIT_EVENT);
    }
  }

  @TestMethod
  public async refusesToReadAnIdThatIsNotPositiveAsync(): Promise<void> {
    const error = await Assert.throwsAsync(() => ProcessIdentity.readAsync(0), ArgumentOutOfRangeException);

    Assert.areEqual("processId", error.parameterName);
  }
}
