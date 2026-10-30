/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptDotDotDotNode } from "../delimiters/typescript-dot-dot-dot.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptNamedTupleMemberNode extends Node {
  public readonly colonNode: TypeScriptColonNode;
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;
  public readonly nameNode: Node;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly typeNode: Node;

  public constructor(
    nameNode: Node,
    colonNode: TypeScriptColonNode,
    span: SourceSpan,
    typeNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    questionNode?: TypeScriptQuestionNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.dotDotDotNode = dotDotDotNode;
    this.nameNode = nameNode;
    this.questionNode = questionNode;
    this.colonNode = colonNode;
    this.typeNode = typeNode;
  }
}
