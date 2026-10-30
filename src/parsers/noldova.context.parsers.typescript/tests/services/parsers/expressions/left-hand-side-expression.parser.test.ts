/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type NodeType, Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptCallExpressionNode,
  TypeScriptElementAccessExpressionNode,
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptNewExpressionNode,
  TypeScriptNonNullExpressionNode,
  TypeScriptParser,
  TypeScriptPropertyAccessExpressionNode,
  TypeScriptTaggedTemplateExpressionNode,
  TypeScriptVariableDeclarationNode,
  TypeScriptVariableStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class LeftHandSideExpressionParserTests {
  @TestMethod
  @TestData("left.field()", TypeScriptCallExpressionNode)
  @TestData("left()[key]", TypeScriptElementAccessExpressionNode)
  @TestData("left?.field()", TypeScriptCallExpressionNode)
  @TestData("left<T>()", TypeScriptCallExpressionNode)
  @TestData("left<<T>() => T>()", TypeScriptCallExpressionNode)
  @TestData("left?.<T>()", TypeScriptCallExpressionNode)
  @TestData("left?.<<T>() => T>()", TypeScriptCallExpressionNode)
  @TestData("left`text`", TypeScriptTaggedTemplateExpressionNode)
  @TestData("left<T>`text`", TypeScriptTaggedTemplateExpressionNode)
  @TestData("left`a${value}b`", TypeScriptTaggedTemplateExpressionNode)
  @TestData("new Constructor().field", TypeScriptPropertyAccessExpressionNode)
  @TestData("new Constructor.field()", TypeScriptNewExpressionNode)
  @TestData("import.meta.field", TypeScriptPropertyAccessExpressionNode)
  @TestData("left!", TypeScriptNonNullExpressionNode)
  public combinesSuffixesWithoutConsumingOutsideTheSourceRegion(content: string, expectedType: Function & NodeType): void {
    const prefix = "host:";
    const reader = new SourceReader(new Source(prefix + content + ";foreign"), new SourceSpan(prefix.length, content.length + 1));

    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(1, result.rootNode.children.length);
    const statement = result.rootNode.children[0];
    Assert.isInstanceOf(statement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(statement.expressionNode, expectedType);
    Assert.areEqual(prefix.length, statement.expressionNode.span.startOffset);
    Assert.areEqual(prefix.length + content.length, statement.expressionNode.span.endOffset);
    Assert.areEqual(prefix.length, result.rootNode.span.startOffset);
    Assert.areEqual(content.length + 1, result.rootNode.span.length);
    Assert.areEqual(prefix.length + content.length + 1, reader.currentOffset);
    Assert.areEqual(0, result.diagnostics.length);
  }

  @TestMethod
  public parsesOrderedExpressionSuffixes(): void {
    const expressionNode = TypeScriptParserFixture.create("target().property[key]!").parseExpression();

    Assert.isInstanceOf(expressionNode, TypeScriptNonNullExpressionNode);
    Assert.isInstanceOf(expressionNode.expressionNode, TypeScriptElementAccessExpressionNode);
    Assert.isInstanceOf(expressionNode.expressionNode.expressionNode, TypeScriptPropertyAccessExpressionNode);
    Assert.isInstanceOf(expressionNode.expressionNode.expressionNode.expressionNode, TypeScriptCallExpressionNode);
  }

  @TestData("f<T U>();", "TS1005@4:1|TS1109@7:1")
  @TestData("f<T>!.x;", "TS1109@5:1")
  @TestData("target?.<Value>argument);", "TS1003@8:1|TS1005@23:1")
  @TestData("f<A + B>();", "TS1109@9:1")
  @TestMethod
  public returnsDiagnosticsAndContinuesAfterMalformedGenericSuffixes(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content + " const recovered = 1;");

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.project(result.diagnostics));
    const statementNode = result.rootNode.children.at(-1);
    Assert.isInstanceOf(statementNode, TypeScriptVariableStatementNode);
    const declarationNode = statementNode.declarationListNode.children[0];
    Assert.isInstanceOf(declarationNode, TypeScriptVariableDeclarationNode);
    Assert.isInstanceOf(declarationNode.nameNode, TypeScriptIdentifierNode);
    Assert.areEqual("recovered", declarationNode.nameNode.value);
  }

  @TestData("const a = <<T>(x: T) => T>(y) => y;", "TS1109@10:2 Expression expected.|TS1005@30:2 ';' expected.")
  @TestData("x = <<T>(y);", "TS1109@4:2 Expression expected.")
  @TestData("x = <<T>y;", "TS1109@4:2 Expression expected.")
  @TestData("x = <<T>`t`;", "TS1109@4:2 Expression expected.")
  @TestData("x = <<T>(y)?.z;", "TS1109@4:2 Expression expected.")
  @TestData("x = .a;", "TS1109@4:1 Expression expected.")
  @TestData("x = ?.a;", "TS1109@4:2 Expression expected.")
  @TestData("x = ?.(1);", "TS1109@4:2 Expression expected.")
  @TestData("new <<T>(y);", "TS1109@4:2 Expression expected.")
  @TestData("x = import<<T>() => void>(\"x\");", "TS1109@4:6 Expression expected.|TS1109@10:2 Expression expected.")
  @TestMethod
  public readsTheMemberAndCallRestOfAMissingOperand(content: string, expected: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
