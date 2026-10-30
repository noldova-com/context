/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptLineCommentNode, TypeScriptNoSubstitutionTemplateLiteralNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptNoSubstitutionTemplateLiteralNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const value = "`text`";
    const node = new TypeScriptNoSubstitutionTemplateLiteralNode(value, new SourceSpan(0, value.length));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesValueSpanAndTrivia(): void {
    const leadingTrivia = new TypeScriptLineCommentNode(" leading", new SourceSpan(0, 10));
    const value = "`text`";
    const span = new SourceSpan(10, value.length);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptNoSubstitutionTemplateLiteralNode(value, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(value, node.value);
    Assert.areEqual(span, node.span);
    Assert.areEqual<Node | undefined>(leadingTrivia, node.leadingTrivia);
    Assert.areEqual<Node | undefined>(trailingTrivia, node.trailingTrivia);
  }
}
