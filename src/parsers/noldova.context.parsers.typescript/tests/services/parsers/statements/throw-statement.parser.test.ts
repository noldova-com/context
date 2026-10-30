/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { DiagnosticCategory } from "@noldova/context.diagnostics";
import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptExpressionStatementNode,
  TypeScriptIdentifierNode,
  TypeScriptMissingExpressionNode,
  TypeScriptParser,
  TypeScriptThrowStatementNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptGrammarFixture } from "../../../fixtures/typescript-grammar.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class ThrowStatementParserTests {
  @TestData("\n")
  @TestData("\r")
  @TestData("\r\n")
  @TestData("\u2028")
  @TestData("\u2029")
  @TestData(" /* comment */\n")
  @TestData("/*\n*/")
  @TestData("// comment\n")
  @TestMethod
  public reportsTheMissingOperandAfterThrowRatherThanTheNextExpression(separator: string): void {
    const result = TypeScriptParser.parse(`throw${separator}value;`, "source.ts");
    const statement = result.rootNode.children[0];
    const followingStatement = result.rootNode.children[1];
    const diagnostic = result.diagnostics[0];

    Assert.areEqual(2, result.rootNode.children.length);
    Assert.isInstanceOf(statement, TypeScriptThrowStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(5, statement.expressionNode.span.startOffset);
    Assert.areEqual(0, statement.expressionNode.span.length);
    Assert.isUndefined(statement.expressionNode.leadingTrivia);
    Assert.areEqual(5, statement.span.length);
    Assert.isInstanceOf(followingStatement, TypeScriptExpressionStatementNode);
    Assert.isInstanceOf(followingStatement.expressionNode, TypeScriptIdentifierNode);
    Assert.areEqual("value", followingStatement.expressionNode.value);
    Assert.areEqual(5 + separator.length, followingStatement.span.startOffset);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.isDefined(diagnostic);
    Assert.areEqual("TS1142", diagnostic.code.displayText);
    Assert.areEqual(DiagnosticCategory.Error, diagnostic.category);
    Assert.areEqual("Line break not permitted here.", diagnostic.message.text);
    Assert.areEqual("source.ts", diagnostic.location?.sourceIdentity);
    Assert.areEqual(5, diagnostic.location?.start);
    Assert.areEqual(0, diagnostic.location?.length);
  }

  @TestData("throw\n")
  @TestData("throw /* comment */\n")
  @TestData("throw\n;")
  @TestMethod
  public preservesTheMissingOperandPositionAtEndOfInputOrASemicolon(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1142", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(5, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
    Assert.isUndefined(result.diagnostics[0]?.location?.sourceIdentity);
  }

  @TestMethod
  public keepsTheAbsoluteMissingOperandSpanForEmbeddedInput(): void {
    const content = " /* leading */ throw\nvalue;";
    const source = new Source("prefix" + content + "suffix", "embedded.ts");
    const reader = new SourceReader(source, new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();

    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1142", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(26, result.diagnostics[0]?.location?.start);
    Assert.areEqual(0, result.diagnostics[0]?.location?.length);
    Assert.areEqual("embedded.ts", result.diagnostics[0]?.location?.sourceIdentity);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.isDefined(result.rootNode.children[0]?.leadingTrivia);
  }

  @TestMethod
  public rollsBackDeferredGrammarDiagnosticsDuringTentativeParsing(): void {
    const parser = TypeScriptParserFixture.create("throw\nvalue;");
    const keyword = parser.currentNode;
    parser.tryParse(() => {
      parser.parseStatement();
      Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
      Assert.isFalse(parser.context.diagnosticCollector.hasTypeScriptParseDiagnosticsSince(0));
      return undefined;
    });

    Assert.areEqual(keyword, parser.currentNode);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
    parser.parseStatement();
    Assert.areEqual(1, parser.context.diagnosticCollector.diagnostics.length);
    Assert.areEqual(5, TypeScriptGrammarFixture.getDiagnostics(parser)[0]?.location?.start);
    Assert.areEqual(0, TypeScriptGrammarFixture.getDiagnostics(parser)[0]?.location?.length);
  }

  @TestMethod
  public parsesAThrownExpression(): void {
    const parser = TypeScriptParserFixture.create("throw value;");
    const node = parser.parseStatement();

    Assert.isInstanceOf(node, TypeScriptThrowStatementNode);
    Assert.isInstanceOf(node.expressionNode, TypeScriptIdentifierNode);
    Assert.isTrue(parser.isEndOfFile);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestData("throw;", 5, "TS1109@5:1 Expression expected.")
  @TestData("throw", 5, "TS1109@5:0 Expression expected.")
  @TestData("throw /* comment */", 5, "TS1109@5:0 Expression expected.")
  @TestData("throw )", 5, "TS1109@6:1 Expression expected.")
  @TestMethod
  public reportsAMissingThrownExpression(content: string, offset: number, expected: string): void {
    const result = TypeScriptParser.parse(content);
    const statement = result.rootNode.children[0];

    Assert.areEqual(1, result.rootNode.children.length);
    Assert.isInstanceOf(statement, TypeScriptThrowStatementNode);
    Assert.isInstanceOf(statement.expressionNode, TypeScriptMissingExpressionNode);
    Assert.areEqual(offset, statement.expressionNode.span.startOffset);
    Assert.areEqual(0, statement.expressionNode.span.length);
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.projectWithMessages(result.diagnostics));
  }
}
