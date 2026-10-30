/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptExportKeywordNode, TypeScriptMissingDeclarationNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptMissingDeclarationNodeTests {
  @TestMethod
  public preservesThePrefixSpanAndTrivia(): void {
    const span = new SourceSpan(1, 6);
    const keyword = new TypeScriptExportKeywordNode(span);
    const modifiers = [keyword];
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(7, 1));
    const node = new TypeScriptMissingDeclarationNode(modifiers, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(modifiers, node.modifierNodes);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
