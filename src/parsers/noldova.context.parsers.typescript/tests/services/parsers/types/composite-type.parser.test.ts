/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptConditionalTypeNode,
  TypeScriptExtendsKeywordNode,
  TypeScriptIntersectionTypeNode,
  TypeScriptTypeReferenceNode,
  TypeScriptUnionTypeNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class CompositeTypeParserTests {
  @TestMethod
  public parsesUnionIntersectionAndConditionalTypes(): void {
    const parser = TypeScriptParserFixture.create("Left | Middle & Right extends Base ? True : False");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptConditionalTypeNode);
    Assert.isInstanceOf(node.checkTypeNode, TypeScriptUnionTypeNode);
    Assert.isInstanceOf(node.checkTypeNode.children[1], TypeScriptIntersectionTypeNode);
    Assert.areEqual(0, node.span.startOffset);
    Assert.areEqual(49, node.span.length);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public endsTheCheckTypeAtALineBreakBeforeExtends(): void {
    const parser = TypeScriptParserFixture.create("Check\nextends Base ? True : False");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptTypeReferenceNode);
    Assert.isInstanceOf(parser.currentNode, TypeScriptExtendsKeywordNode);
    Assert.areEqual(6, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public continuesAConditionalTypeAcrossALineBreakBeforeTheQuestion(): void {
    const parser = TypeScriptParserFixture.create("Check extends Base\n? True : False");
    const node = parser.parseType();

    Assert.isInstanceOf(node, TypeScriptConditionalTypeNode);
    Assert.isInstanceOf(node.checkTypeNode, TypeScriptTypeReferenceNode);
    Assert.isInstanceOf(node.falseTypeNode, TypeScriptTypeReferenceNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }
}
