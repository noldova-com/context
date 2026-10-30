/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class FailingRejectionFixtureTests {
  @TestMethod
  public throwsAndRejects(): void {
    void Promise.reject(new Error("stray"));
    throw new Error("primary");
  }
}
