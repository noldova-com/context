/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptBreakKeywordNode } from "../keywords/typescript-break-keyword.node.js";

export class TypeScriptBreakStatementNode extends Node {
  public readonly breakKeywordNode: TypeScriptBreakKeywordNode;
  public readonly labelNode: Node | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    breakKeywordNode: TypeScriptBreakKeywordNode,
    span: SourceSpan,
    labelNode?: Node,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.breakKeywordNode = breakKeywordNode;
    this.labelNode = labelNode;
    this.semicolonNode = semicolonNode;
  }
}
