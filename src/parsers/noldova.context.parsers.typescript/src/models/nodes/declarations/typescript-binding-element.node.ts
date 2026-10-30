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

export class TypeScriptBindingElementNode extends Node {
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly dotDotDotNode: TypeScriptDotDotDotNode | undefined;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly initializerNode: Node | undefined;
  public readonly nameNode: Node;
  public readonly propertyNameNode: Node | undefined;

  public constructor(
    span: SourceSpan,
    nameNode: Node,
    dotDotDotNode?: TypeScriptDotDotDotNode,
    propertyNameNode?: Node,
    colonNode?: TypeScriptColonNode,
    equalsNode?: TypeScriptEqualsNode,
    initializerNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.dotDotDotNode = dotDotDotNode;
    this.propertyNameNode = propertyNameNode;
    this.colonNode = colonNode;
    this.nameNode = nameNode;
    this.equalsNode = equalsNode;
    this.initializerNode = initializerNode;
  }
}
