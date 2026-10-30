/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { TypeScriptBlockCommentNode, TypeScriptTriviaNode } from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestData, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTriviaNodeExtensionsTests {
  @TestData(" text ", false)
  @TestData("\ntext ", true)
  @TestData("\u2028text ", true)
  @TestMethod
  public combinesItsChildLineBreakFacts(value: string, expected: boolean): void {
    const whitespace = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const comment = new TypeScriptBlockCommentNode(value, new SourceSpan(1, value.length + 4));
    const node = new TypeScriptTriviaNode([whitespace, comment], new SourceSpan(0, comment.span.endOffset));

    Assert.areEqual(expected, node.containsTypeScriptLineBreak());
  }

  @TestMethod
  public handlesEmptyAndNestedTrivia(): void {
    const empty = new TypeScriptTriviaNode([], new SourceSpan(0, 0));
    const whitespace = new WhitespaceNode("\n", new SourceSpan(0, 1));
    const inner = new TypeScriptTriviaNode([whitespace], whitespace.span);
    const outer = new TypeScriptTriviaNode([inner], inner.span);

    Assert.isFalse(empty.containsTypeScriptLineBreak());
    Assert.isTrue(outer.containsTypeScriptLineBreak());
  }
}
