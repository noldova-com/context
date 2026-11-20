/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ReplacingTemporaryFolderFixtureTests {
  @TestMethod
  public replacesTheRunsTemporaryFolderWithAFile(): void {
    const directory = tmpdir();
    rmSync(directory, { recursive: true, force: true });
    writeFileSync(directory, String.empty);
  }
}
