/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptAwaitKeywordNode } from "../keywords/typescript-await-keyword.node.js";
import type { TypeScriptConstKeywordNode } from "../keywords/typescript-const-keyword.node.js";
import type { TypeScriptLetKeywordNode } from "../keywords/typescript-let-keyword.node.js";
import type { TypeScriptUsingKeywordNode } from "../keywords/typescript-using-keyword.node.js";
import type { TypeScriptVarKeywordNode } from "../keywords/typescript-var-keyword.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptVariableDeclarationNode } from "./typescript-variable-declaration.node.js";

export class TypeScriptVariableDeclarationListNode extends TypeScriptDelimitedListNode {
  public declare readonly children: readonly TypeScriptVariableDeclarationNode[];
  public readonly awaitKeywordNode: TypeScriptAwaitKeywordNode | undefined;
  public readonly keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode;

  public constructor(
    keywordNode: TypeScriptConstKeywordNode | TypeScriptLetKeywordNode | TypeScriptVarKeywordNode | TypeScriptUsingKeywordNode,
    declarationNodes: readonly TypeScriptVariableDeclarationNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    awaitKeywordNode?: TypeScriptAwaitKeywordNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(declarationNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.awaitKeywordNode = awaitKeywordNode;
    this.keywordNode = keywordNode;
  }
}
