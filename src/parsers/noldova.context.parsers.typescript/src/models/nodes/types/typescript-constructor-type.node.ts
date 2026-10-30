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
import type { TypeScriptAbstractKeywordNode } from "../keywords/typescript-abstract-keyword.node.js";
import type { TypeScriptNewKeywordNode } from "../keywords/typescript-new-keyword.node.js";
import type { TypeScriptArrowNode } from "../operators/typescript-arrow.node.js";
import type { TypeScriptTypeParameterListNode } from "./typescript-type-parameter-list.node.js";

export class TypeScriptConstructorTypeNode extends Node {
  public readonly abstractKeywordNode: TypeScriptAbstractKeywordNode | undefined;
  public readonly arrowNode: TypeScriptArrowNode | undefined;
  public readonly newKeywordNode: TypeScriptNewKeywordNode;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly returnTypeNode: Node;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    newKeywordNode: TypeScriptNewKeywordNode,
    span: SourceSpan,
    returnTypeNode: Node,
    parameterListNode: TypeScriptParameterListNode,
    abstractKeywordNode?: TypeScriptAbstractKeywordNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    arrowNode?: TypeScriptArrowNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.abstractKeywordNode = abstractKeywordNode;
    this.newKeywordNode = newKeywordNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterListNode = parameterListNode;
    this.arrowNode = arrowNode;
    this.returnTypeNode = returnTypeNode;
  }
}
