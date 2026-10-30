/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import {
  TypeScriptExpressionStatementNode,
  TypeScriptInterfaceDeclarationNode,
  TypeScriptInterfaceKeywordNode,
  TypeScriptParser
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

import { TypeScriptDiagnosticsFixture } from "../../../fixtures/typescript-diagnostics.fixture.js";
import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptInterfaceKeywordNodeExtensionsTests {
  @TestData("interface")
  @TestData("interface()")
  @TestData("interface = 1;")
  @TestMethod
  public keepsIdentifierUsesAsExpressions(content: string): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual("TS1212", result.diagnostics[0]?.code.displayText);
    Assert.areEqual(0, result.diagnostics[0]?.location?.start);
    Assert.areEqual("interface".length, result.diagnostics[0]?.location?.length);
  }

  @TestData("interface {}", "TS1438", 10, 1)
  @TestData("interface\nA {}", "TS1434", 10, 1)
  @TestData("interface §;", "TS1127", 10, 1)
  @TestData("interface true;", "TS2427", 10, 4)
  @TestMethod
  public handlesMissingNamesLineBoundariesAndLexicalFailures(content: string, code: string, start: number, length: number): void {
    const result = TypeScriptParser.parse(content);

    Assert.isInstanceOf(result.rootNode.children[0], TypeScriptExpressionStatementNode);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(code, result.diagnostics[0]?.code.displayText);
    Assert.areEqual(start, result.diagnostics[0]?.location?.start);
    Assert.areEqual(length, result.diagnostics[0]?.location?.length);
  }

  @TestMethod
  public dispatchesAGenericDeclarationWithItsOriginalLeadingTrivia(): void {
    const prefix = " /* lead */ ";
    const content = "interface Box<T> { value: T; }";
    const parser = TypeScriptParserFixture.create(prefix + content + ";");
    const keyword = parser.currentNode;
    const node = keyword.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(keyword, node.interfaceKeywordNode);
    Assert.areEqual(keyword.leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + content.length, node.span.endOffset);
    Assert.areEqual(node.span.endOffset, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public preservesAbsoluteCoordinatesInABoundedReader(): void {
    const content = "interface Box { value: }";
    const reader = new SourceReader(new Source("<html>" + content + "</html>"), new SourceSpan(6, content.length));
    const result = new TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptInterfaceDeclarationNode);
    Assert.areEqual(6, node.span.startOffset);
    Assert.areEqual(6 + content.length, node.span.endOffset);
    Assert.areEqual(6 + content.length, reader.currentOffset);
    Assert.areEqual(6 + content.indexOf("}"), result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics.length);
  }

  @TestMethod
  public isABindingIdentifier(): void {
    const node = new TypeScriptInterfaceKeywordNode(new SourceSpan(0, 0));

    Assert.isTrue(node.isTypeScriptBindingIdentifier());
  }

  @TestData("export default interface I {}", "")
  @TestMethod
  public followsADefault(content: string, expected: string): void {
    Assert.areEqual(expected, TypeScriptDiagnosticsFixture.parse(content));
  }
}
