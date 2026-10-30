/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptColonNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptColonNodeExtensionsTests {
  @TestMethod
  public startsNoStatement(): void {
    const parser = TypeScriptParserFixture.create(":");

    Assert.isTrue(parser.currentNode.isTypeScriptUnexpectedStatementToken(parser));
  }

  @TestMethod
  public canFollowAnOptionalParameterMarker(): void {
    Assert.isTrue(new TypeScriptColonNode(new SourceSpan(0, 1)).canFollowTypeScriptOptionalParameterMarker());
  }

  @TestMethod
  public indicatesAFunctionTypeAndAnIndexSignatureParameter(): void {
    const node = new TypeScriptColonNode(new SourceSpan(0, 1));

    Assert.isTrue(node.isTypeScriptFunctionTypeParameterIndicator());
    Assert.isTrue(node.isTypeScriptIndexSignatureParameterIndicator(TypeScriptParserFixture.create(":")));
  }
}
