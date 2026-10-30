/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class LeavingFileFixtureTests {
  @TestMethod
  public async leavesAFileAsync(): Promise<void> {
    await writeFile(join(tmpdir(), "left-behind.txt"), "left");
  }
}
