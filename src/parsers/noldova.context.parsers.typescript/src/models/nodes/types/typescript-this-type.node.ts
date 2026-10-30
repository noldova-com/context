/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptThisKeywordNode } from "../keywords/typescript-this-keyword.node.js";

export class TypeScriptThisTypeNode extends Node {
  public readonly thisKeywordNode: TypeScriptThisKeywordNode;

  public constructor(thisKeywordNode: TypeScriptThisKeywordNode, span: SourceSpan, leadingTrivia?: Node, trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.thisKeywordNode = thisKeywordNode;
  }
}
