/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { TestClass, TestMethod } from "@noldova/context.testing";

setInterval(() => undefined, 1_000);
await new Promise<void>(() => { });

@TestClass
export class StallingFixtureTests {
  @TestMethod
  public passes(): void { }
}
