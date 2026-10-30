/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TypeScriptTypePredicateNode, TypeScriptTypeReferenceNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptAssertsKeywordNodeExtensionsTests {
  @TestMethod
  public dispatchesAssertionsAndOrdinaryTypeNames(): void {
    Assert.isInstanceOf(TypeScriptParserFixture.create("asserts value is T").parseType(), TypeScriptTypePredicateNode);
    Assert.isInstanceOf(TypeScriptParserFixture.create("asserts").parseType(), TypeScriptTypeReferenceNode);
  }
}
