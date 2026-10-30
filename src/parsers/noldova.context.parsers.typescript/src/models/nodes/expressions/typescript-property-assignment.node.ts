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
import type { TypeScriptExclamationNode } from "../operators/typescript-exclamation.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptPropertyAssignmentNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly initializerNode: Node;
  public readonly modifierNodes: readonly Node[];
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly exclamationNode: TypeScriptExclamationNode | undefined;
  public readonly nameNode: Node;

  public constructor(
    span: SourceSpan,
    nameNode: Node,
    initializerNode: Node,
    colonNode?: TypeScriptColonNode,
    questionNode?: TypeScriptQuestionNode,
    exclamationNode?: TypeScriptExclamationNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.colonNode = colonNode;
    this.initializerNode = initializerNode;
    this.modifierNodes = modifierNodes;
    this.questionNode = questionNode;
    this.exclamationNode = exclamationNode;
  }
}
