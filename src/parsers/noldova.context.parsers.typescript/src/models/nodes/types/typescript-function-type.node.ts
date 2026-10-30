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
import type { TypeScriptArrowNode } from "../operators/typescript-arrow.node.js";
import type { TypeScriptTypeParameterListNode } from "./typescript-type-parameter-list.node.js";

export class TypeScriptFunctionTypeNode extends Node {
  public readonly arrowNode: TypeScriptArrowNode | undefined;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly returnTypeNode: Node;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    span: SourceSpan,
    returnTypeNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    arrowNode?: TypeScriptArrowNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.arrowNode = arrowNode;
    this.returnTypeNode = returnTypeNode;
  }
}
