/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptExtendsKeywordNode } from "../keywords/typescript-extends-keyword.node.js";
import type { TypeScriptImplementsKeywordNode } from "../keywords/typescript-implements-keyword.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";

export class TypeScriptHeritageClauseNode extends TypeScriptDelimitedListNode {
  public readonly keywordNode: TypeScriptExtendsKeywordNode | TypeScriptImplementsKeywordNode;

  public constructor(
    keywordNode: TypeScriptExtendsKeywordNode | TypeScriptImplementsKeywordNode,
    typeNodes: readonly Node[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(typeNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.keywordNode = keywordNode;
  }
}
