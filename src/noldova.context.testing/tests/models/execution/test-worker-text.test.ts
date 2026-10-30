/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";
import { TestWorkerText } from "@noldova/context.testing/models/execution/test-worker-text.js";

@TestClass
export class TestWorkerTextTests {
  @TestMethod
  public printsAsItsText(): void {
    const text = new TestWorkerText("[object Sample]");

    Assert.areEqual("[object Sample]", text.text);
    Assert.areEqual("[object Sample]", String(text));
  }
}
