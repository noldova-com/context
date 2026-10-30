/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCaseClauseNode } from "../clauses/typescript-case-clause.node.js";
import type { TypeScriptDefaultClauseNode } from "../clauses/typescript-default-clause.node.js";
import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";

export class TypeScriptCaseBlockNode extends CompositeNode {
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  public constructor(
    clauses: readonly (TypeScriptCaseClauseNode | TypeScriptDefaultClauseNode)[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(clauses, span, leadingTrivia, trailingTrivia);
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
  }
}
