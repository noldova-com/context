/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptStaticKeywordNode } from "../keywords/typescript-static-keyword.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";

export class TypeScriptStaticBlockNode extends Node {
  public readonly bodyNode: TypeScriptBlockNode;
  public readonly modifierNodes: readonly Node[];
  public readonly staticKeywordNode: TypeScriptStaticKeywordNode;

  public constructor(
    modifierNodes: readonly Node[],
    staticKeywordNode: TypeScriptStaticKeywordNode,
    bodyNode: TypeScriptBlockNode,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.staticKeywordNode = staticKeywordNode;
    this.bodyNode = bodyNode;
  }
}
