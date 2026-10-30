/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { writeFile } from "node:fs/promises";

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
class FirstLoadFixture {
  @TestMethod
  public passes(): void { }
}

@TestClass
class LaterLoadFixture {
  @TestMethod
  public passes(): void { }

  @TestMethod
  public passesAgain(): void { }
}

let isFirstLoad = true;
try {
  await writeFile(new URL(import.meta.url).searchParams.get("claim") ?? String.empty, String.empty, { flag: "wx" });
}
catch {
  isFirstLoad = false;
}

export const VaryingFixtureTests = isFirstLoad ? FirstLoadFixture : LaterLoadFixture;
