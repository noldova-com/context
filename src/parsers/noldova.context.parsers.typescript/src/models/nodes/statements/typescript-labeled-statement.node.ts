/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";

export class TypeScriptLabeledStatementNode extends Node {
  public readonly labelNode: Node;
  public readonly colonNode: TypeScriptColonNode;
  public readonly statementNode: Node;

  public constructor(
    labelNode: Node,
    colonNode: TypeScriptColonNode,
    statementNode: Node,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.labelNode = labelNode;
    this.colonNode = colonNode;
    this.statementNode = statementNode;
  }
}
