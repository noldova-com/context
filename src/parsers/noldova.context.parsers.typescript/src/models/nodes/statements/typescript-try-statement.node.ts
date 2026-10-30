/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCatchClauseNode } from "../clauses/typescript-catch-clause.node.js";
import type { TypeScriptFinallyKeywordNode } from "../keywords/typescript-finally-keyword.node.js";
import type { TypeScriptTryKeywordNode } from "../keywords/typescript-try-keyword.node.js";
import type { TypeScriptBlockNode } from "./typescript-block.node.js";

export class TypeScriptTryStatementNode extends Node {
  public readonly tryKeywordNode: TypeScriptTryKeywordNode | undefined;
  public readonly tryBlockNode: TypeScriptBlockNode;
  public readonly catchClauseNode: TypeScriptCatchClauseNode | undefined;
  public readonly finallyKeywordNode: TypeScriptFinallyKeywordNode | undefined;
  public readonly finallyBlockNode: TypeScriptBlockNode | undefined;

  public constructor(
    tryKeywordNode: TypeScriptTryKeywordNode | undefined,
    span: SourceSpan,
    tryBlockNode: TypeScriptBlockNode,
    catchClauseNode?: TypeScriptCatchClauseNode,
    finallyKeywordNode?: TypeScriptFinallyKeywordNode,
    finallyBlockNode?: TypeScriptBlockNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.tryKeywordNode = tryKeywordNode;
    this.tryBlockNode = tryBlockNode;
    this.catchClauseNode = catchClauseNode;
    this.finallyKeywordNode = finallyKeywordNode;
    this.finallyBlockNode = finallyBlockNode;
  }
}
