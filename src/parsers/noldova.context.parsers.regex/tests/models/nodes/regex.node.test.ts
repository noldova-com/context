/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import { RegexAlternativeNode, RegexDisjunctionNode, RegexFlagsNode, RegexNode, RegexPatternNode } from "@noldova/context.parsers.regex";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { CommentNodeFixture } from "../../fixtures/comment-node.fixture.js";

@TestClass
export class RegexNodeTests {
  @TestMethod
  public constructorDefaultsTriviaToUndefined(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(0, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const patternNode = new RegexPatternNode(String.empty, disjunctionNode, disjunctionNode.span);
    const flagsNode = new RegexFlagsNode(String.empty, new SourceSpan(0, 0));
    const node = new RegexNode(String.empty, patternNode, flagsNode, new SourceSpan(0, 0));

    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesOriginalAndParsedForms(): void {
    const alternative = new RegexAlternativeNode([], new SourceSpan(1, 0));
    const disjunctionNode = new RegexDisjunctionNode([alternative], alternative.span);
    const patternNode = new RegexPatternNode(String.empty, disjunctionNode, disjunctionNode.span);
    const flagsNode = new RegexFlagsNode("g", new SourceSpan(2, 1));
    const rawValue = "//g";
    const span = new SourceSpan(0, rawValue.length);
    const leadingTrivia = new CommentNodeFixture(" leading", new SourceSpan(0, 10));
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(13, 1));
    const node = new RegexNode(rawValue, patternNode, flagsNode, span, leadingTrivia, trailingTrivia);

    Assert.areEqual(rawValue, node.rawValue);
    Assert.areEqual(patternNode, node.patternNode);
    Assert.areEqual(flagsNode, node.flagsNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual<Node | undefined>(leadingTrivia, node.leadingTrivia);
    Assert.areEqual<Node | undefined>(trailingTrivia, node.trailingTrivia);
    Assert.isInstanceOf(node, Node);
  }
}
