/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptDefaultKeywordNode } from "../keywords/typescript-default-keyword.node.js";

export class TypeScriptDefaultClauseNode extends CompositeNode {
  public readonly defaultKeywordNode: TypeScriptDefaultKeywordNode;
  public readonly colonNode: TypeScriptColonNode | undefined;

  public constructor(
    defaultKeywordNode: TypeScriptDefaultKeywordNode,
    statements: readonly Node[],
    span: SourceSpan,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(statements, span, leadingTrivia, trailingTrivia);
    this.defaultKeywordNode = defaultKeywordNode;
    this.colonNode = colonNode;
  }
}
