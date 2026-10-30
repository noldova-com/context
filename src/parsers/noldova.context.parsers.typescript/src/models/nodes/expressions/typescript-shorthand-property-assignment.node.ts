/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";
import type { TypeScriptExclamationNode } from "../operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptShorthandPropertyAssignmentNode extends Node {
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly initializerNode: Node | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;
  public readonly nameNode: Node;

  public constructor(
    nameNode: Node,
    span: SourceSpan,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.equalsNode = equalsNode;
    this.initializerNode = initializerNode;
    this.modifierNodes = modifierNodes;
    this.questionNode = questionNode;
    this.exclamationNode = exclamationNode;
  }
}
