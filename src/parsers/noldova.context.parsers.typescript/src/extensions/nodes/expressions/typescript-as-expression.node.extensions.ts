/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import { TypeScriptAsExpressionNode } from "../../../models/nodes/expressions/typescript-as-expression.node.js";

TypeScriptAsExpressionNode.prototype.getTypeScriptQuickTypeSkippedSpan = function (this: TypeScriptAsExpressionNode): SourceSpan | undefined {
  return this.typeNode.isTypeScriptConstReference() ? undefined : this.span;
};

TypeScriptAsExpressionNode.prototype.readsTypeScriptContextualType = function (this: TypeScriptAsExpressionNode): boolean {
  let node: Node = this;
  while (node instanceof TypeScriptAsExpressionNode) {
    if (!node.typeNode.isTypeScriptConstReference())
      return false;
    node = node.expressionNode;
  }
  return node.readsTypeScriptContextualType();
};
