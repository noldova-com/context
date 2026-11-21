/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { KeyValuePair } from "@noldova/context.collections";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class KeyValuePairTests {
  @TestMethod
  public carriesTheKeyAndTheValue(): void {
    const entry = new KeyValuePair("Leo", 7);

    Assert.areEqual("Leo", entry.key);
    Assert.areEqual(7, entry.value);
  }
}
