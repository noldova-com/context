/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  TypeScriptBinaryExpressionNode,
  TypeScriptEmptyStatementNode,
  TypeScriptExclamationNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptLabeledStatementNode,
  TypeScriptMissingExpressionNode,
  TypeScriptNonNullExpressionNode,
  TypeScriptParser,
  TypeScriptPrefixUnaryExpressionNode,
  TypeScriptSemicolonNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ExpressionOrLabeledStatementParserTests {
  @TestData(")")
  @TestData("]")
  @TestData(":")
  @TestData(",")
  @TestData("case")
  @TestMethod
  public skipsSourceListRecoveryTokensWithoutCreatingExpressionStatements(token: string): void {
    const result = TypeScriptParser.parse(token + " values;");
    Assert.areEqual(1, result.rootNode.children.length);
    const followingStatement = result.rootNode.children[0];
    Assert.isInstanceOf(followingStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(followingStatement.expressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("values", followingStatement.expressionNode.value);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1128", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(token.length, result.diagnostics[0]?.location?.length);
  }

  @TestData("label: run();", "")
  @TestData("namespace: while (x) break namespace;", "")
  @TestData("type: value;", "")
  @TestData("async: value;", "")
  @TestData("await: ;", "")
  @TestData("yield: ;", "TS1212")
  @TestData("label\n: ;", "")
  @TestData("\\u0061: ;", "")
  @TestMethod
  public recognizesIdentifierLabelsAfterParsingTheirExpression(content: string, expectedCode: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptLabeledStatementNode);
    Assert.areEqual(expectedCode, result.diagnostics.map(t => t.code.displayText).join(","));
  }

  @TestData("(label): ;", "TS1005@7:1 ';' expected.")
  @TestData("label!: ;", "TS1005@6:1 ';' expected.")
  @TestData("a.b: ;", "TS1005@3:1 ';' expected.")
  @TestMethod
  public doesNotTurnAnArbitraryExpressionIntoALabel(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }

  @TestMethod
  public retainsNestedLabelsAndRestoresThemAfterRollback(): void {
    const parser = TypeScriptParserFixture.create("outer: inner: while(x) break outer;");
    const initial = parser.currentNode;
    parser.lookAhead(() => { parser.parseStatement(); return true; });
    Assert.areEqual(initial, parser.currentNode);
    parser.tryParse(() => { parser.parseStatement(); return undefined; });
    Assert.areEqual(initial, parser.currentNode);
    const node = parser.parseStatement();
    Assert.isInstanceOf(node, TypeScriptLabeledStatementNode);
    Assert.isInstanceOf(node.statementNode, TypeScriptLabeledStatementNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public appliesTheRecursionLimitToNestedLabels(): void {
    const result = TypeScriptParser.parse("label:".repeat(600) + ";");
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("CTX2000", result.diagnostics[0]?.code.displayText);
  }

  @TestData("a", 2)
  @TestData("as", 3)
  @TestMethod
  public preservesTheEmptyStatementAfterARejectedCharacter(name: string, errorOffset: number): void {
    const result = TypeScriptParser.parse(`${name} §;`);

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptEmptyStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1127", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(errorOffset, result.diagnostics[0]?.location?.start);
  }

  @TestMethod
  public retainsEachScannerErrorWhileSkippingRejectedTokens(): void {
    const empty = TypeScriptParser.parse("§");
    const followed = TypeScriptParser.parse("§§value;");

    Assert.areEqual(0, empty.rootNode.children.length);
    Assert.areEqual(1, empty.rootNode.span.length);
    Assert.areEqual(1, empty.diagnostics.length);
    Assert.areEqual(1, followed.rootNode.children.length);
    Assert.areEqual(2, followed.diagnostics.length);
    Assert.areEqual(0, followed.diagnostics[0]?.location?.start);
    Assert.areEqual(1, followed.diagnostics[1]?.location?.start);
    Assert.isTrue(followed.diagnostics.every(t => t.code.displayText === "TS1127"));
  }

  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData("\u2028")
  @TestData("\u2029")
  @TestData("/*\n*/")
  @TestData("// comment\n")
  @TestMethod
  public keepsAnExclamationAfterALineBreakInTheFollowingStatement(separator: string): void {
    const result = TypeScriptParser.parse(`a${separator}!b;`);
    const first = result.rootNode.children[0];
    const second = result.rootNode.children[1];

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(first, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(first.expressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("a", first.expressionNode.value);
    Assert.areEqual(1, first.span.length);
    Assert.isUndefined(first.semicolonNode);
    Assert.isInstanceOf(second, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(second.expressionNode, TypeScriptPrefixUnaryExpressionNode);
    Assert.isInstanceOf(second.expressionNode.operatorNode, TypeScriptExclamationNode);
    Assert.isInstanceOf(second.expressionNode.operandNode, TypeScriptIdentifierNode);
    Assert.areEqual("b", second.expressionNode.operandNode.value);
    Assert.areEqual(separator.length + 1, second.span.startOffset);
    Assert.isDefined(second.leadingTrivia);
    Assert.isInstanceOf(second.semicolonNode, TypeScriptSemicolonNode);
  }

  @TestData("a!;")
  @TestData("a /* same line */ !;")
  @TestMethod
  public retainsSameLineNonNullAssertions(content: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptNonNullExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.expressionNode, TypeScriptIdentifierNode);
  }

  @TestData("a b;", "TS1434", 0, 1, "Unexpected keyword or identifier.")
  @TestData("as b;", "TS1434", 0, 2, "Unexpected keyword or identifier.")
  @TestData("a!b;", "TS1005", 2, 1, "';' expected.")
  @TestData("call() next();", "TS1005", 7, 4, "';' expected.")
  @TestData("1 next;", "TS1005", 2, 4, "';' expected.")
  @TestMethod
  public diagnosesMissingSeparatorsWithoutLosingTheFollowingStatement(
    content: string,
    code: string,
    start: number,
    length: number,
    message: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(message, result.diagnostics[0]?.message.text);
    Assert.isInstanceOf(result.rootNode.children[1], TypeScriptExpressionStatementNode);
  }

  @TestData("as")
  @TestData("satisfies")
  @TestMethod
  public doesNotJoinTypeSuffixesAcrossLineBreaks(keyword: string): void {
    const result = TypeScriptParser.parse(`a\n${keyword} T;`);
    const first = result.rootNode.children[0];

    Assert.areEqual(3, result.rootNode.children.length);
    Assert.isInstanceOf(first, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(first.expressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("a", first.expressionNode.value);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1434", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(2, result.diagnostics[0]?.location?.start);
    Assert.areEqual(keyword.length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public preservesLeadingTrivia(): void {
    const result = TypeScriptParser.parse(" value;");
    const statement = result.rootNode.children[0];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isDefined(statement.leadingTrivia);
  }

  @TestMethod
  public parsesExpressionsWithAndWithoutSemicolons(): void {
    const explicitResult = TypeScriptParser.parse("value;");
    const implicitResult = TypeScriptParser.parse("value");
    const explicitStatement = explicitResult.rootNode.children[0];
    const implicitStatement = implicitResult.rootNode.children[0];

    Assert.isInstanceOf(explicitStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(explicitStatement.semicolonNode, TypeScriptSemicolonNode);
    Assert.areEqual(6, explicitStatement.span.length);
    Assert.isInstanceOf(implicitStatement, TypeScriptExpressionStatementNode);
    Assert.isUndefined(implicitStatement.semicolonNode);
    Assert.areEqual(5, implicitStatement.span.length);
  }

  @TestMethod
  public startsAStatementWhoseExpressionBeginsWithAMissingOperandAtThatOperand(): void {
    const result = TypeScriptParser.parse("a;\n  * 2;");
    const statement = result.rootNode.children[1];

    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.leftNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(2, statement.expressionNode.leftNode.span.startOffset);
    Assert.areEqual(2, statement.span.startOffset);
    Assert.areEqual(9, statement.span.endOffset);
    Assert.areEqual("TS1109@5:1", TypeScriptDiagnosticsFixture.project(result.diagnostics));
  }
}
