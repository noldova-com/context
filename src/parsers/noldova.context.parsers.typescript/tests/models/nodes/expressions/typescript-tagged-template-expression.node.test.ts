/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SourceSpan, WhitespaceNode } from "@noldova/context.parsers";
import {
  TypeScriptIdentifierNode,
  TypeScriptLessThanNode,
  TypeScriptNoSubstitutionTemplateLiteralNode,
  TypeScriptQuestionDotNode,
  TypeScriptTaggedTemplateExpressionNode,
  TypeScriptTypeArgumentListNode
} from "@noldova/context.parsers.typescript";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class TypeScriptTaggedTemplateExpressionNodeTests {
  @TestMethod
  public constructorDefaultsOmittedArguments(): void {
    const tagNode = new TypeScriptIdentifierNode("tag", new SourceSpan(0, 3));
    const templateNode = new TypeScriptNoSubstitutionTemplateLiteralNode("`text`", new SourceSpan(3, 6));
    const node = new TypeScriptTaggedTemplateExpressionNode(tagNode, templateNode, new SourceSpan(0, 9));

    Assert.isUndefined(node.questionDotNode);
    Assert.isUndefined(node.typeArgumentListNode);
    Assert.isUndefined(node.leadingTrivia);
    Assert.isUndefined(node.trailingTrivia);
  }

  @TestMethod
  public constructorPreservesRolesSpanAndTrivia(): void {
    const leadingTrivia = new WhitespaceNode(" ", new SourceSpan(0, 1));
    const tagNode = new TypeScriptIdentifierNode("tag", new SourceSpan(1, 3));
    const questionDotNode = new TypeScriptQuestionDotNode(new SourceSpan(4, 2));
    const typeArgumentListNode = new TypeScriptTypeArgumentListNode(new TypeScriptLessThanNode(new SourceSpan(6, 1)), [], [], new SourceSpan(6, 1));
    const templateNode = new TypeScriptNoSubstitutionTemplateLiteralNode("`text`", new SourceSpan(7, 6));
    const span = new SourceSpan(1, 12);
    const trailingTrivia = new WhitespaceNode(" ", new SourceSpan(span.endOffset, 1));
    const node = new TypeScriptTaggedTemplateExpressionNode(tagNode, templateNode, span, questionDotNode, typeArgumentListNode, leadingTrivia, trailingTrivia);

    Assert.areEqual(tagNode, node.tagNode);
    Assert.areEqual(templateNode, node.templateNode);
    Assert.areEqual(questionDotNode, node.questionDotNode);
    Assert.areEqual(typeArgumentListNode, node.typeArgumentListNode);
    Assert.areEqual(span, node.span);
    Assert.areEqual(leadingTrivia, node.leadingTrivia);
    Assert.areEqual(trailingTrivia, node.trailingTrivia);
  }
}
