/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptBinaryExpressionNode,
  TypeScriptIdentifierNode,
  TypeScriptInKeywordNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { TypeScriptAssociativity } from "@noldova/context.parsers.typescript/enums/typescript-associativity.js";
import { TypeScriptContextFlags } from "@noldova/context.parsers.typescript/enums/typescript-context-flags.js";
import { TypeScriptOperatorPrecedence } from "@noldova/context.parsers.typescript/enums/typescript-operator-precedence.js";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptInKeywordNodeExtensionsTests {
  @TestMethod
  public startsATypeParameter(): void {
    const parser = TypeScriptParserFixture.create("in");
    Assert.isTrue(parser.currentNode.canStartTypeScriptTypeParameter());
  }

  @TestMethod
  public bindsAsALeftAssociativeRelationalOperator(): void {
    const node = new TypeScriptInKeywordNode(new SourceSpan(0, 1));

    Assert.areEqual(TypeScriptOperatorPrecedence.Relational, node.getTypeScriptPrecedence());
    Assert.areEqual(TypeScriptAssociativity.Left, node.getTypeScriptAssociativity());
  }

  @TestMethod
  public actsAsAnOperatorOnlyWhereItIsAllowed(): void {
    const allowedParser = TypeScriptParserFixture.create("left in right");
    const disallowedParser = TypeScriptParserFixture.create("left in right", TypeScriptContextFlags.DisallowIn);

    Assert.isInstanceOf(allowedParser.parseExpression(), TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(disallowedParser.parseExpression(), TypeScriptIdentifierNode);
    const node = disallowedParser.currentNode;
    Assert.isInstanceOf(node, TypeScriptInKeywordNode);
    Assert.isFalse(node.canStartTypeScriptExpression(disallowedParser));
    Assert.isTrue(node.isTypeScriptUnexpectedStatementToken(disallowedParser));
    Assert.isTrue(node.canStartTypeScriptExpression(allowedParser));
    Assert.isFalse(node.isTypeScriptUnexpectedStatementToken(allowedParser));
  }

  @TestMethod
  public parsesItsExpressionWithPreservedBoundaries(): void {
    const prefix = " /*leading*/ ";
    const content = "left in right";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const leadingTrivia = parser.currentNode.leadingTrivia;

    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptBinaryExpressionNode);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.isInstanceOf(parser.currentNode, TypeScriptSemicolonNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public readsAsAModifierInEveryModifierList(): void {
    const node = TypeScriptParserFixture.create("in").currentNode;

    Assert.isTrue(node.isTypeScriptDeclarationModifier());
    Assert.isTrue(node.isTypeScriptClassMemberModifier());
    Assert.isTrue(node.isTypeScriptParameterModifier());
    Assert.isTrue(node.isTypeScriptTypeMemberModifier());
    Assert.isTrue(node.isTypeScriptTypeParameterModifier());
  }

  @TestData("@dec in class C {}", "TS1274@5:2")
  @TestData("@dec override in class C {}", "TS1274@14:2")
  @TestData("class C { in v = 1; }", "TS1274@10:2")
  @TestData("function f(in x: number) {}", "TS1274@11:2")
  @TestData("interface I { in v: number; }", "TS1070@14:2")
  @TestData("type T = { in v: number };", "TS1070@11:2")
  @TestData("class C { in [k: string]: number; }", "TS1071@10:2")
  @TestData("class C<in T> {}", "")
  @TestMethod
  public reportsAVarianceAnnotationWrittenOnWhatDeclaresNoTypeParameter(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }

  @TestData("class C<in in T> {}", "TS1030@11:2")
  @TestData("function f<in T>() {}", "TS1274@11:2")
  @TestData("interface I { m<in T>(): void }", "TS1274@16:2")
  @TestData("class C<in T> {}", "")
  @TestData("interface I<in T> {}", "")
  @TestData("type T<in U> = U;", "")
  @TestData("class C<in out T> {}", "")
  @TestData("class C<out in T> {}", "TS1029@12:2")
  @TestData("interface I<in out T, out in U> {}", "TS1029@26:2")
  @TestMethod
  public reportsAVarianceAnnotationATypeParameterCannotCarry(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
