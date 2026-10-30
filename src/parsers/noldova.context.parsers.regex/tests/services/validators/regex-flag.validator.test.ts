/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexFlagValidatorTests {
  @TestMethod
  public reportsUnknownDuplicateAndConflictingFlagsInSourceOrder(): void {
    const diagnostics = RegexParserFixture.parse(String.empty, "gguvx").diagnostics;

    Assert.areEqual(3, diagnostics.length);
    Assert.areEqual("CTX1001", diagnostics[0]?.code.displayText);
    Assert.areEqual("CTX1002", diagnostics[1]?.code.displayText);
    Assert.areEqual("CTX1000", diagnostics[2]?.code.displayText);
  }

  @TestMethod
  public acceptsEverySupportedNonConflictingFlag(): void {
    Assert.areEqual(0, RegexParserFixture.parse(String.empty, "dgimsyu").diagnostics.length);
    Assert.areEqual(0, RegexParserFixture.parse(String.empty, "dgimsyv").diagnostics.length);
  }
}
