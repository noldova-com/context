/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class HangingFixtureTests {
  @TestMethod
  public async hangsAsync(): Promise<void> {
    await new Promise<void>(() => { });
  }

  @TestMethod
  public passes(): void { }
}
