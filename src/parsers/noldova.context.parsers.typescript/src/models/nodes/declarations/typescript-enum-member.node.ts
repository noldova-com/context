/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";

export class TypeScriptEnumMemberNode extends Node {
  public readonly nameNode: Node;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly initializerNode: Node | undefined;

  public constructor(nameNode: Node, span: SourceSpan, equalsNode?: TypeScriptEqualsNode, initializerNode?: Node, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.nameNode = nameNode;
    this.equalsNode = equalsNode;
    this.initializerNode = initializerNode;
  }
}
