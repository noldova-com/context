/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptFromKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptFromKeywordNodeExtensionsTests {
  @TestData("from \"m\"", true)
  @TestData("from 'm'", true)
  @TestData("from m", false)
  @TestData("from", false)
  @TestMethod
  public startsTheFromClauseOnlyBeforeAModuleString(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);
    Assert.isInstanceOf(parser.currentNode, TypeScriptFromKeywordNode);

    Assert.areEqual(expected, parser.currentNode.startsTypeScriptFromClause(parser));
    Assert.areEqual(0, parser.currentNode.span.startOffset);
  }
}
