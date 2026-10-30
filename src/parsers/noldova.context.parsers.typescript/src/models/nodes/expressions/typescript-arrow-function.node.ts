/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptParameterListNode } from "../declarations/typescript-parameter-list.node.js";
import type { TypeScriptParameterNode } from "../declarations/typescript-parameter.node.js";
import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptArrowNode } from "../operators/typescript-arrow.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";

export class TypeScriptArrowFunctionNode extends Node {
  public readonly arrowNode: TypeScriptArrowNode | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly bodyNode: Node;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly parameterListNode: TypeScriptParameterListNode | undefined;
  public readonly parameterNode: TypeScriptParameterNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    span: SourceSpan,
    arrowNode: TypeScriptArrowNode | undefined,
    bodyNode: Node,
    modifierNodes: readonly Node[] = [],
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    parameterNode?: TypeScriptParameterNode,
    parameterListNode?: TypeScriptParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.arrowNode = arrowNode;
    this.bodyNode = bodyNode;
    this.modifierNodes = modifierNodes;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterNode = parameterNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
  }
}
