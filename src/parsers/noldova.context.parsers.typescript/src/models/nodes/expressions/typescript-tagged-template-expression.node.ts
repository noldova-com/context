/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptQuestionDotNode } from "../operators/typescript-question-dot.node.js";
import type { TypeScriptTypeArgumentListNode } from "../types/typescript-type-argument-list.node.js";

export class TypeScriptTaggedTemplateExpressionNode extends Node {
  public readonly questionDotNode: TypeScriptQuestionDotNode | undefined;
  public readonly tagNode: Node;
  public readonly templateNode: Node;
  public readonly typeArgumentListNode: TypeScriptTypeArgumentListNode | undefined;

  public constructor(
    tagNode: Node,
    templateNode: Node,
    span: SourceSpan,
    questionDotNode?: TypeScriptQuestionDotNode,
    typeArgumentListNode?: TypeScriptTypeArgumentListNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.tagNode = tagNode;
    this.templateNode = templateNode;
    this.questionDotNode = questionDotNode;
    this.typeArgumentListNode = typeArgumentListNode;
  }
}
