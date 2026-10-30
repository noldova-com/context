/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Source, SourceReader, SourceSpan } from "@noldova/context.parsers";
import { TypeScriptEnumDeclarationNode, TypeScriptEnumKeywordNode, TypeScriptParser } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { TypeScriptParserFixture } from "../../../fixtures/typescript-parser.fixture.js";

@TestClass
export class TypeScriptEnumKeywordNodeExtensionsTests {
  @TestMethod
  public dispatchesItsDeclarationAndKeepsTheFollowingToken(): void {
    const prefix = " /* lead */ ";
    const text = "enum E { A, B = 2 }";
    const parser = TypeScriptParserFixture.create(prefix + text + ";");
    const keyword = parser.currentNode;
    Assert.isInstanceOf(keyword, TypeScriptEnumKeywordNode);
    const node = keyword.parseTypeScriptStatement(parser);

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(keyword, node.enumKeywordNode);
    Assert.areEqual(keyword.leadingTrivia, node.leadingTrivia);
    Assert.areEqual(prefix.length, node.span.startOffset);
    Assert.areEqual(prefix.length + text.length, node.span.endOffset);
    Assert.areEqual(node.span.endOffset, parser.currentNode.span.startOffset);
    Assert.areEqual(0, parser.context.diagnosticCollector.diagnostics.length);
  }

  @TestMethod
  public parsesOnlyTheBoundedEmbeddedInput(): void {
    const text = "enum E { A = , B }";
    const source = new Source("<html>" + text + "</html>");
    const reader = new SourceReader(source, new SourceSpan(6, text.length));
    const result = new TypeScriptParser(reader).parse();
    const node = result.rootNode.children[0];

    Assert.isInstanceOf(node, TypeScriptEnumDeclarationNode);
    Assert.areEqual(6, node.span.startOffset);
    Assert.areEqual(6 + text.length, node.span.endOffset);
    Assert.areEqual(6 + text.length, reader.currentOffset);
    Assert.areEqual(19, result.diagnostics[0]?.location?.start);
    Assert.areEqual(1, result.diagnostics.length);
    Assert.areEqual(2, node.children.length);
  }
}
