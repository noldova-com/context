/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptYieldKeywordNode } from "../keywords/typescript-yield-keyword.node.js";
import type { TypeScriptAsteriskNode } from "../operators/typescript-asterisk.node.js";

export class TypeScriptYieldExpressionNode extends Node {
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;
  public readonly expressionNode: Node | undefined;
  public readonly yieldKeywordNode: TypeScriptYieldKeywordNode;

  public constructor(
    yieldKeywordNode: TypeScriptYieldKeywordNode,
    span: SourceSpan,
    asteriskNode?: TypeScriptAsteriskNode,
    expressionNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.yieldKeywordNode = yieldKeywordNode;
    this.asteriskNode = asteriskNode;
    this.expressionNode = expressionNode;
  }
}
