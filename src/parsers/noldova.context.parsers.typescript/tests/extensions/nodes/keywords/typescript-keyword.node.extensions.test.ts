/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import { TypeScriptIfKeywordNode, TypeScriptYieldKeywordNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptKeywordNodeExtensionsTests {
  @TestMethod
  public readsAReservedWordAsAPropertyNameAndAnAccessName(): void {
    const node = new TypeScriptIfKeywordNode(new SourceSpan(0, 1));

    Assert.isTrue(node.canStartTypeScriptPropertyName());
    Assert.isTrue(node.isTypeScriptAccessName());
  }

  @TestMethod
  public readsAReservedWordAsNeitherABindingNameNorALeftHandSideExpression(): void {
    const node = new TypeScriptIfKeywordNode(new SourceSpan(0, 1));

    Assert.isUndefined(node.toTypeScriptBindingName());
    Assert.isFalse(node.isTypeScriptLeftHandSideExpression());
  }

  @TestMethod
  public readsABindingKeywordAsItsOwnBindingNameAndALeftHandSideExpression(): void {
    const node = new TypeScriptYieldKeywordNode(new SourceSpan(0, 5));

    Assert.areEqual(node, node.toTypeScriptBindingName());
    Assert.isTrue(node.isTypeScriptLeftHandSideExpression());
  }

  @TestData("static ...a", true)
  @TestData("public @dec a", true)
  @TestData("const ...a", false)
  @TestData("abstract @dec a", false)
  @TestData("declare { }", false)
  @TestData("declare abstract ...a", false)
  @TestData("declare static ...a", true)
  @TestData("async *m", true)
  @TestData("default x", true)
  @TestData("const #a", true)
  @TestData("abstract function x", false)
  @TestData("abstract function()", true)
  @TestData("function [a]", true)
  @TestData("function x", false)
  @TestData("async ()", true)
  @TestData("declare .a", false)
  @TestData("declare\n...a", true)
  @TestData("declare", true)
  @TestMethod
  public startsAClassMemberAsTheReferenceReadsOne(content: string, expected: boolean): void {
    const parser = TypeScriptParserFixture.create(content);

    Assert.areEqual(expected, parser.currentNode.canStartTypeScriptClassMember(parser));
  }

  @TestMethod
  public readsARunOfModifiersOfAnyLength(): void {
    const parser = TypeScriptParserFixture.create("async ".repeat(5000) + "x");

    Assert.isTrue(parser.currentNode.canStartTypeScriptClassMember(parser));
  }
}
