/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { nameof } from "@noldova/context.core";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class ResourcesTests {
  @TestMethod
  public reportsTheCanonicalNameofFailureMessage(): void {
    const failure = Assert.throws(() => nameof<StringConstructor>((): "empty" => "empty"), TypeError);

    Assert.areEqual("The value must be a string member name or a selector that returns exactly one selected string member.", failure.message);
  }
}
