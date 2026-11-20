/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { spawnSync } from "node:child_process";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class BlockingFixtureTests {
  private static readonly CHILD_SCRIPT: string = "const parent = Number(process.argv[1]); " +
    "setInterval(() => { try { process.kill(parent, 0); } catch { process.exit(); } }, 100); setTimeout(() => process.exit(), 30_000);";

  @TestMethod
  public waitsOnAChildProcess(): void {
    const environment = { ...process.env };
    delete environment["NODE_V8_COVERAGE"];
    spawnSync(process.execPath, ["--eval", BlockingFixtureTests.CHILD_SCRIPT, String(process.pid)], { env: environment, stdio: "ignore" });
  }

  @TestMethod
  public passesAfterTheBlock(): void { }
}
