/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptOptionalTypeNode extends Node {
  public readonly questionNode: TypeScriptQuestionNode;
  public readonly typeNode: Node;

  public constructor(
    typeNode: Node,
    questionNode: TypeScriptQuestionNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeNode = typeNode;
    this.questionNode = questionNode;
  }
}
