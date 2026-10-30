/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseParenthesisNode } from "../delimiters/typescript-close-parenthesis.node.js";
import type { TypeScriptOpenParenthesisNode } from "../delimiters/typescript-open-parenthesis.node.js";
import type { TypeScriptRequireKeywordNode } from "../keywords/typescript-require-keyword.node.js";

export class TypeScriptExternalModuleReferenceNode extends Node {
  public readonly requireKeywordNode: TypeScriptRequireKeywordNode;
  public readonly openParenthesisNode: TypeScriptOpenParenthesisNode;
  public readonly moduleSpecifierNode: Node;
  public readonly closeParenthesisNode: TypeScriptCloseParenthesisNode | undefined;

  public constructor(
    requireKeywordNode: TypeScriptRequireKeywordNode,
    span: SourceSpan,
    openParenthesisNode: TypeScriptOpenParenthesisNode,
    moduleSpecifierNode: Node,
    closeParenthesisNode?: TypeScriptCloseParenthesisNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.requireKeywordNode = requireKeywordNode;
    this.openParenthesisNode = openParenthesisNode;
    this.moduleSpecifierNode = moduleSpecifierNode;
    this.closeParenthesisNode = closeParenthesisNode;
  }
}
