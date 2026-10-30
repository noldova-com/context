/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptLineCommentNode, TypeScriptTriviaNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTriviaNodeTests {
  @TestMethod
  public constructorAcceptsEmptyChildren(): void {
    const span = new SourceSpan(0, 0);
    const node = new TypeScriptTriviaNode([], span);

    Assert.areEqual(0, node.children.length);
    Assert.areEqual(span, node.span);
  }

  @TestMethod
  public constructorPreservesWhitespaceAndCommentNodesInSourceOrder(): void {
    const whitespace = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const comment = new TypeScriptLineCommentNode(" comment", new SourceSpan(1, 10));
    const children: Node[] = [whitespace, comment];
    const span = new SourceSpan(0, 11);
    const node = new TypeScriptTriviaNode(children, span);

    Assert.areEqual(2, node.children.length);
    Assert.areEqual(whitespace, node.children[0]);
    Assert.areEqual(comment, node.children[1]);
    Assert.areEqual(span, node.span);
  }
}
