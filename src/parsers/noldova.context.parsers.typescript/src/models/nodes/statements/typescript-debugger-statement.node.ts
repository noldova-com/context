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
import type { TypeScriptDebuggerKeywordNode } from "../keywords/typescript-debugger-keyword.node.js";

export class TypeScriptDebuggerStatementNode extends Node {
  public readonly debuggerKeywordNode: TypeScriptDebuggerKeywordNode;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    debuggerKeywordNode: TypeScriptDebuggerKeywordNode,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.debuggerKeywordNode = debuggerKeywordNode;
    this.semicolonNode = semicolonNode;
  }
}
