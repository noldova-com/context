/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptVariableDeclarationNode } from "../declarations/typescript-variable-declaration.node.js";
import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptCatchKeywordNode } from "../keywords/typescript-catch-keyword.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";

export class TypeScriptCatchClauseNode extends Node {
  public readonly catchKeywordNode: TypeScriptCatchKeywordNode;
  public readonly blockNode: TypeScriptBlockNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode | undefined;
  public readonly variableDeclarationNode: TypeScriptVariableDeclarationNode | undefined;
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  public constructor(
    catchKeywordNode: TypeScriptCatchKeywordNode,
    span: SourceSpan,
    blockNode: TypeScriptBlockNode,
    openParenthesisNode?: TypeScriptOpenParenthesisNode,
    variableDeclarationNode?: TypeScriptVariableDeclarationNode,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.catchKeywordNode = catchKeywordNode;
    this.blockNode = blockNode;
    this.openParenthesisNode = openParenthesisNode;
    this.variableDeclarationNode = variableDeclarationNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
