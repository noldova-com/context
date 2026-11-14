/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node } from "@noldova/context.parsers";

import type { TypeScriptParameterListNode } from "./nodes/declarations/typescript-parameter-list.node.js";
import type { TypeScriptParameterNode } from "./nodes/declarations/typescript-parameter.node.js";
import type { TypeScriptColonNode } from "./nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptAsyncKeywordNode } from "./nodes/keywords/typescript-async-keyword.node.js";
import type { TypeScriptArrowNode } from "./nodes/operators/typescript-arrow.node.js";
import type { TypeScriptTypeParameterListNode } from "./nodes/types/typescript-type-parameter-list.node.js";

export class TypeScriptArrowFunctionParts {
  public readonly startNode: Node;
  public readonly asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;
  public readonly parameterNode: TypeScriptParameterNode | undefined;
  public readonly parameterListNode: TypeScriptParameterListNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly arrowNode: TypeScriptArrowNode | undefined;
  public readonly bodyNode: Node;

  public constructor(
    startNode: Node,
    asyncKeywordNode: TypeScriptAsyncKeywordNode | undefined,
    typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
    parameterNode: TypeScriptParameterNode | undefined,
    parameterListNode: TypeScriptParameterListNode | undefined,
    colonNode: TypeScriptColonNode | undefined,
    returnTypeNode: Node | undefined,
    arrowNode: TypeScriptArrowNode | undefined,
    bodyNode: Node) {
    this.startNode = startNode;
    this.asyncKeywordNode = asyncKeywordNode;
    this.typeParameterListNode = typeParameterListNode;
    this.parameterNode = parameterNode;
    this.parameterListNode = parameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.arrowNode = arrowNode;
    this.bodyNode = bodyNode;
  }
}
