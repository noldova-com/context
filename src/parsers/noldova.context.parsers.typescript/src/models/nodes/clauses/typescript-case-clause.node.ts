/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptCaseKeywordNode } from "../keywords/typescript-case-keyword.node.js";

export class TypeScriptCaseClauseNode extends CompositeNode {
  public readonly caseKeywordNode: TypeScriptCaseKeywordNode;
  public readonly expressionNode: Node;
  public readonly colonNode: TypeScriptColonNode | undefined;

  public constructor(
    caseKeywordNode: TypeScriptCaseKeywordNode,
    expressionNode: Node,
    statements: readonly Node[],
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(statements, span, leadingTrivia, trailingTrivia);
    this.caseKeywordNode = caseKeywordNode;
    this.expressionNode = expressionNode;
    this.colonNode = colonNode;
  }
}
