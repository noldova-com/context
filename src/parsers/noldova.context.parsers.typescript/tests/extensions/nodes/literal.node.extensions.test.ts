/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../fixtures/typescript-parser.fixture.js";

@TestClass
export class LiteralNodeExtensionsTests {
  @TestData('"x"', "x")
  @TestData("0x10", "16")
  @TestData("1n", "1n")
  @TestMethod
  public recordsItsScannedValue(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptParserFixture.create(content).currentNode.getTypeScriptTokenValue());
  }
}
