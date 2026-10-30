/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptInferKeywordNode } from "../keywords/typescript-infer-keyword.node.js";
import type { TypeScriptTypeParameterNode } from "./typescript-type-parameter.node.js";

export class TypeScriptInferTypeNode extends Node {
  public readonly inferKeywordNode: TypeScriptInferKeywordNode;
  public readonly typeParameterNode: TypeScriptTypeParameterNode;

  public constructor(
    inferKeywordNode: TypeScriptInferKeywordNode,
    span: SourceSpan,
    typeParameterNode: TypeScriptTypeParameterNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.inferKeywordNode = inferKeywordNode;
    this.typeParameterNode = typeParameterNode;
  }
}
