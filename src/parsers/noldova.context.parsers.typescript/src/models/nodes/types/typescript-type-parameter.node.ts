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

export class TypeScriptTypeParameterNode extends Node {
  public readonly constraintKeywordNode: Node | undefined;
  public readonly constraintNode: Node | undefined;
  public readonly defaultTypeNode: Node | undefined;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly nameNode: Node;

  public constructor(
    modifierNodes: readonly Node[],
    nameNode: Node,
    span: SourceSpan,
    constraintKeywordNode?: Node,
    constraintNode?: Node,
    equalsNode?: TypeScriptEqualsNode,
    defaultTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.nameNode = nameNode;
    this.constraintKeywordNode = constraintKeywordNode;
    this.constraintNode = constraintNode;
    this.equalsNode = equalsNode;
    this.defaultTypeNode = defaultTypeNode;
  }
}
