/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RegexGroupName } from "@noldova/context.parsers.regex/models/regex-group-name.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class RegexGroupNameTests {
  @TestMethod
  @TestData(true)
  @TestData(false)
  public preservesElementValidityIndependentlyOfDecodedText(isValid: boolean): void {
    const name = new RegexGroupName("𝒜", isValid);

    Assert.areEqual("𝒜", name.value);
    Assert.areEqual(isValid, name.isValid);
  }
}
