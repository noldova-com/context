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
  @TestMethod
  public waitsOnAChildProcess(): void {
    spawnSync(process.execPath, ["--eval", "setTimeout(() => undefined, 30_000);"], { stdio: "ignore" });
  }

  @TestMethod
  public passesAfterTheBlock(): void { }
}
