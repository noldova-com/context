/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptAsteriskAsteriskNode,
  TypeScriptAwaitExpressionNode,
  TypeScriptBinaryExpressionNode,
  TypeScriptDeleteExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser,
  TypeScriptPostfixUnaryExpressionNode,
  TypeScriptPrefixUnaryExpressionNode,
  TypeScriptTypeAssertionExpressionNode,
  TypeScriptTypeOfExpressionNode,
  TypeScriptVoidExpressionNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class UnaryExpressionParserTests {
  @TestData(")")
  @TestData("]")
  @TestData("}")
  @TestMethod
  public leavesAClosingDelimiterForItsOwnerWhenTheUnaryOperandIsMissing(delimiter: string): void {
    const parser = TypeScriptParserFixture.create("!" + delimiter);
    const node = parser.parseUnaryExpression();
    Assert.isInstanceOf(node, TypeScriptPrefixUnaryExpressionNode);
    Assert.isInstanceOf(node.operandNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(1, node.operandNode.span.startOffset);
    Assert.areEqual(0, node.operandNode.span.length);
    Assert.isUndefined(node.operandNode.unexpectedNode);
    Assert.areEqual(1, parser.currentNode.span.startOffset);
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS1109", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("-2", "-")
  @TestData("+2", "+")
  @TestData("~a", "~")
  @TestData("!a", "!")
  @TestData("typeof a", "typeof")
  @TestData("void a", "void")
  @TestData("delete a.x", "delete")
  @TestData("await a", "await")
  @TestData("await", "await")
  @TestData("- -a", "-")
  @TestData("!!a", "!")
  @TestData("-++a", "-")
  @TestData("typeof ++a", "typeof")
  @TestMethod
  public rejectsUnparenthesizedUnaryExponentiationLeftOperands(operand: string, operator: string): void {
    const result = TypeScriptParser.parse(`${operand} ** b;`);
    const statement = result.rootNode.children[0];

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS17006", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(operand.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(
      `An unary expression with the '${operator}' operator is not allowed in the left-hand side of an exponentiation expression. `
      + "Consider enclosing the expression in parentheses.",
      result.diagnostics[0]?.message.text);
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.operatorNode, TypeScriptAsteriskAsteriskNode);
    Assert.areEqual(operand.length, statement.expressionNode.leftNode.span.length);
  }

  @TestData("<T>a")
  @TestData("<T>++a")
  @TestMethod
  public reportsTypeAssertionsWithTheirDistinctDiagnostic(operand: string): void {
    const result = TypeScriptParser.parse(`${operand} ** b;`);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS17007", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(operand.length, result.diagnostics[0]?.location?.length);
    Assert.areEqual(
      "A type assertion expression is not allowed in the left-hand side of an exponentiation expression. "
      + "Consider enclosing the expression in parentheses.",
      result.diagnostics[0]?.message.text);
  }

  @TestData("(-2) ** 2;")
  @TestData("-(2 ** 2);")
  @TestData("2 ** -3;")
  @TestData("++a ** b;")
  @TestData("--a ** b;")
  @TestData("a++ ** b;")
  @TestData("a-- ** b;")
  @TestData("(<T>a) ** b;")
  @TestData("async function f() { (await a) ** b; }")
  @TestMethod
  public permitsParenthesizedUpdateAndRightHandUnaryOperands(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(0, result.diagnostics.length);
    Assert.areEqual(1, result.rootNode.children.length);
  }

  @TestMethod
  public reportsEachInvalidLeftOperandInSourceOrderAndRetainsRightAssociativity(): void {
    const result = TypeScriptParser.parse("-2 ** -3 ** 4;");
    const statement = result.rootNode.children[0];

    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual("TS17006", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual(2, result.diagnostics[0]?.location?.length);
    Assert.areEqual("TS17006", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(6, result.diagnostics[1]?.location?.start);
    Assert.areEqual(2, result.diagnostics[1]?.location?.length);
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.rightNode, TypeScriptBinaryExpressionNode);
    Assert.isInstanceOf(statement.expressionNode.rightNode.leftNode, TypeScriptPrefixUnaryExpressionNode);
  }

  @TestData("await a ** b;", 1, 7)
  @TestData("await ++a ** b;", 1, 9)
  @TestData("2 ** await a;", 0, 0)
  @TestMethod
  public appliesExponentiationRulesInsideAsyncFunctions(content: string, diagnosticCount: number, length: number): void {
    const prefix = "async function f(){";
    const result = TypeScriptParser.parse(prefix + content + "}");

    Assert.areEqual(diagnosticCount, result.diagnostics.length);
    if (diagnosticCount > 0) {
      Assert.areEqual("TS17006", result.diagnostics[0]?.code.displayText);
      Assert.areEqual(prefix.length, result.diagnostics[0]?.location?.start);
      Assert.areEqual(length, result.diagnostics[0]?.location?.length);
    }
  }

  @TestData("-a **;", "TS17006", 5)
  @TestData("<T>a **;", "TS17007", 7)
  @TestMethod
  public reportsTheLeftOperandBeforeAMissingRightOperand(content: string, code: string, missingStart: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(2, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual("TS1109", result.diagnostics[1]?.code.displayText);
    Assert.areEqual(missingStart, result.diagnostics[1]?.location?.start);
  }

  @TestMethod
  public preservesAbsoluteDiagnosticSpansAndStopsAtTheEmbeddedBoundary(): void {
    const content = "/*lead*/- /*inner*/ a ** b;";
    const source = new Source("prefix" + content + "suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS17006", result.diagnostics[0]?.code.displayText);
    Assert.areEqual("embedded.ts", result.diagnostics[0]?.location?.sourceIdentity);
    Assert.areEqual(14, result.diagnostics[0]?.location?.start);
    Assert.areEqual(13, result.diagnostics[0]?.location?.length);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.isDefined(result.rootNode.children[0]?.leadingTrivia);
  }

  @TestMethod
  public rollsBackUnaryDiagnosticsWithTentativeParsing(): void {
    const parser = TypeScriptParserFixture.create("-a ** b;");
    const first = parser.currentNode;
    parser.lookAhead(() => {
      parser.parseExpression();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
      return true;
    });
    Assert.areEqual(first, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    parser.tryParse(() => {
      parser.parseExpression();
      return undefined;
    });
    Assert.areEqual(first, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);

    parser.parseExpression();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual("TS17006", parser.context.diagnosticCollector.diagnostics[0]?.code.displayText);
  }

  @TestData("+")
  @TestData("-")
  @TestData("~")
  @TestData("!")
  @TestData("++")
  @TestData("--")
  @TestMethod
  public parsesEveryPrefixOperator(operator: string): void {
    const parser = TypeScriptParserFixture.create(`${operator}value`);
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptPrefixUnaryExpressionNode);
    Assert.areEqual(operator, parser.typescriptLexer.reader.source.getText(node.operatorNode.span));
    Assert.isInstanceOf(node.operandNode, TypeScriptIdentifierNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesKeywordAndTypeAssertionExpressions(): void {
    const deleteNode = TypeScriptParserFixture.create("delete value.property").parseExpression();
    const typeofNode = TypeScriptParserFixture.create("typeof value").parseExpression();
    const voidNode = TypeScriptParserFixture.create("void value").parseExpression();
    const awaitNode = TypeScriptParserFixture.create("await value").parseExpression();
    const assertionNode = TypeScriptParserFixture.create("<Value>value").parseExpression();

    Assert.isInstanceOf(deleteNode, TypeScriptDeleteExpressionNode);
    Assert.isInstanceOf(typeofNode, TypeScriptTypeOfExpressionNode);
    Assert.isInstanceOf(voidNode, TypeScriptVoidExpressionNode);
    Assert.isInstanceOf(awaitNode, TypeScriptAwaitExpressionNode);
    Assert.isInstanceOf(assertionNode, TypeScriptTypeAssertionExpressionNode);
  }

  @TestMethod
  public parsesPostfixOperatorsWithoutCrossingLineBreaks(): void {
    const postfixNode = TypeScriptParserFixture.create("value++").parseExpression();
    const lineBreakNode = TypeScriptParserFixture.create("value\n++other").parseExpression();

    Assert.isInstanceOf(postfixNode, TypeScriptPostfixUnaryExpressionNode);
    Assert.isFalse(lineBreakNode instanceof TypeScriptPostfixUnaryExpressionNode);
  }

  @TestMethod
  public reportsAMissingTypeAssertionCloser(): void {
    const parser = TypeScriptParserFixture.create("<Value value");
    const node = parser.parseExpression();

    Assert.isInstanceOf(node, TypeScriptTypeAssertionExpressionNode);
    Assert.isUndefined(node.greaterThanNode);
    Assert.areEqual("TS1005@7:5 '>' expected.", TypeScriptDiagnosticsFixture.projectWithMessages(parser.context.diagnosticCollector.diagnostics));
  }

  @TestData("const x=++ ++a;", "TS1109@11:2 Expression expected.", 2)
  @TestData("const x=-- +a;", "TS1109@11:1 Expression expected.", 1)
  @TestData("async function f(){ await ++await x; }", "TS1109@28:5 Expression expected.", 1)
  @TestData("const a= \n", "TS1109@8:0 Expression expected.", 1)
  @TestMethod
  public reportsAMissingOperandAndKeepsStatementBoundaries(content: string, expectedDiagnostics: string, expectedStatements: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expectedDiagnostics, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
    Assert.areEqual(expectedStatements, result.rootNode.children.length);
  }

  @TestData("x++; f()++; (x?.y)++; --f(); ++x?.y; y--; 1++; ++this; x?.y!.z++;", "TS2357:f(),TS2777:(x?.y),TS2357:f(),TS2777:x?.y,TS2357:1,TS2357:this,TS2777:x?.y!.z")
  @TestData("++{}; --[0]; ++\"s\"; --`t`; ++`a${b}`; ++function () {}; --(() => 1); ++class {}; ++true; --false; ++null; --(\"s\");", "")
  @TestData("delete x; delete (x); delete x.y; delete x[0]; delete f(); delete (x.y); delete x?.y; delete this; delete new C().p; delete (x as any).p; delete x!.p; delete (x as any); delete x!; delete ((x));", "TS1102:x,TS2703:x,TS2703:x,TS2703:f(),TS2703:this,TS2703:x as any,TS2703:x!,TS2703:x")
  @TestMethod
  public refusesAnOperandThatIsNoReference(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectText(content, result.diagnostics));
  }
}
