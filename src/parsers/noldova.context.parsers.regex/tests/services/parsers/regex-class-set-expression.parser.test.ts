/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";
import {
  RegexCharacterClassNode,
  RegexCharacterRangeNode,
  RegexClassIntersectionNode,
  RegexClassSubtractionNode,
  RegexClassUnionNode
} from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { RegexParserFixture } from "../../fixtures/regex-parser.fixture.js";

@TestClass
export class RegexClassSetExpressionParserTests {
  @TestMethod
  @TestData("[a-z&&b]", 1)
  @TestData("[a-z--b]", 1)
  @TestData("[b&&a-z]", 4)
  @TestData("[b--a-z]", 4)
  @TestData("[\\d&&a-z]", 5)
  @TestData("[a-z&&\\q{x}]", 1)
  @TestData("[a&&b&&c-z]", 7)
  @TestData("[a--b--c-z]", 7)
  public rejectsRangesAsDirectSetOperatorOperands(pattern: string, startOffset: number): void {
    const result = RegexParserFixture.parse(pattern, "v");

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX1038", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(startOffset, result.diagnostics[0]?.location?.start);
    Assert.areEqual(3, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  @TestData("[[a-z]&&[b-c]]")
  @TestData("[[a-z]--[b-c]]")
  @TestData("[\\d&&[a-z]]")
  @TestData("[[a-z]&&\\q{x}]")
  @TestData("[a-z]")
  @TestData("[a-zA-Z0-9]")
  @TestData("[a&&b&&c]")
  @TestData("[a--b--c]")
  public acceptsNestedRangeOperandsAndOrdinaryUnions(pattern: string): void {
    Assert.areEqual(0, RegexParserFixture.parse(pattern, "v").diagnostics.length);
  }

  @TestMethod
  public propagatesMayContainStringsThroughSetOperations(): void {
    const union = this.getCharacterClass("[a\\q{bc}]");
    const intersection = this.getCharacterClass("[\\q{ab}&&a]");
    const subtraction = this.getCharacterClass("[\\q{ab}--a]");

    Assert.isTrue(union.mayContainStrings);
    Assert.isFalse(intersection.mayContainStrings);
    Assert.isTrue(subtraction.mayContainStrings);
  }

  @TestMethod
  public parsesUnionIntersectionAndSubtraction(): void {
    Assert.isInstanceOf(this.getExpression("[ab]"), RegexClassUnionNode);
    Assert.isInstanceOf(this.getExpression("[a&&b]"), RegexClassIntersectionNode);
    Assert.isInstanceOf(this.getExpression("[a--b]"), RegexClassSubtractionNode);
  }

  @TestMethod
  public parsesRangesAndNestedClasses(): void {
    const range = this.getExpression("[a-z]");
    const nested = this.getExpression("[[a]b]");
    Assert.isInstanceOf(range, RegexClassUnionNode);
    Assert.isInstanceOf(nested, RegexClassUnionNode);

    Assert.isInstanceOf(range.children[0], RegexCharacterRangeNode);
    Assert.isInstanceOf(nested.children[0], RegexCharacterClassNode);
  }

  @TestMethod
  public parsesAnEmptyUnicodeSetClass(): void {
    const expression = this.getExpression("[]");
    Assert.isInstanceOf(expression, RegexClassUnionNode);
    Assert.areEqual(0, expression.children.length);
  }

  @TestMethod
  public validatesOperatorsReservedPunctuatorsAndRanges(): void {
    Assert.isTrue(this.hasDiagnostic("[&&a]", "CTX1028"));
    Assert.isTrue(this.hasDiagnostic("[&&]", "CTX1028"));
    Assert.isTrue(this.hasDiagnostic("[a&&]", "CTX1028"));
    Assert.isTrue(this.hasDiagnostic("[a&&b--c]", "CTX1027"));
    Assert.isTrue(this.hasDiagnostic("[ab&&]", "CTX1027"));
    Assert.isTrue(this.hasDiagnostic("[a&&bc]", "CTX1027"));
    Assert.isTrue(this.hasDiagnostic("[!!]", "CTX1029"));
    Assert.isTrue(this.hasDiagnostic("[(]", "CTX1034"));
    Assert.isTrue(this.hasDiagnostic("[z-a]", "CTX1026"));
    Assert.isTrue(this.hasDiagnostic("[a-]", "CTX1028"));
  }

  @TestMethod
  public tracksSetExpressionsThatMayContainStrings(): void {
    const union = this.getCharacterClass("[\\p{Basic_Emoji}a]");
    const subtraction = this.getCharacterClass("[\\q{ab}--a]");
    Assert.isInstanceOf(union.expressionNode, RegexClassUnionNode);
    Assert.isInstanceOf(subtraction.expressionNode, RegexClassSubtractionNode);

    Assert.isTrue(union.mayContainStrings);
    Assert.isTrue(subtraction.mayContainStrings);
  }

  private getExpression(pattern: string): Node {
    return this.getCharacterClass(pattern).expressionNode;
  }

  private getCharacterClass(pattern: string): RegexCharacterClassNode {
    const alternative = RegexParserFixture.parseFirstAlternative(pattern, "v");
    const characterClass = alternative.children[0];
    Assert.isInstanceOf(characterClass, RegexCharacterClassNode);
    return characterClass;
  }

  private hasDiagnostic(pattern: string, code: string): boolean {
    return RegexParserFixture.parse(pattern, "v").diagnostics.some(t => t.code.displayText === code);
  }
}
