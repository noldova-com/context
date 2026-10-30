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
import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";
import type { TypeScriptQuestionNode } from "../operators/typescript-question.node.js";

export class TypeScriptParameterNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly initializerNode: Node | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly nameNode: Node;
  public readonly questionNode: TypeScriptQuestionNode | undefined;
  public readonly typeNode: Node | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    span: SourceSpan,
    nameNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    questionNode?: TypeScriptQuestionNode,
    colonNode?: TypeScriptColonNode,
    typeNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.dotDotDotNode = dotDotDotNode;
    this.nameNode = nameNode;
    this.questionNode = questionNode;
    this.colonNode = colonNode;
    this.typeNode = typeNode;
    this.equalsNode = equalsNode;
    this.initializerNode = initializerNode;
  }
}
