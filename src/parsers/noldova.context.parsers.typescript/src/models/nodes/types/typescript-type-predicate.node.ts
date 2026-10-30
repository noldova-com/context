/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptAssertsKeywordNode } from "../keywords/typescript-asserts-keyword.node.js";
import type { TypeScriptIsKeywordNode } from "../keywords/typescript-is-keyword.node.js";

export class TypeScriptTypePredicateNode extends Node {
  public readonly assertsKeywordNode: TypeScriptAssertsKeywordNode | undefined;
  public readonly isKeywordNode: TypeScriptIsKeywordNode | undefined;
  public readonly parameterNameNode: Node;
  public readonly typeNode: Node | undefined;

  public constructor(
    parameterNameNode: Node,
    span: SourceSpan,
    assertsKeywordNode?: TypeScriptAssertsKeywordNode,
    isKeywordNode?: TypeScriptIsKeywordNode,
    typeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.assertsKeywordNode = assertsKeywordNode;
    this.parameterNameNode = parameterNameNode;
    this.isKeywordNode = isKeywordNode;
    this.typeNode = typeNode;
  }
}
