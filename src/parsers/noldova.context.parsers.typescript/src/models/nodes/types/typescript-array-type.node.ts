/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptCloseBracketNode } from "../delimiters/typescript-close-bracket.node.js";
import type { TypeScriptOpenBracketNode } from "../delimiters/typescript-open-bracket.node.js";

export class TypeScriptArrayTypeNode extends Node {
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly elementTypeNode: Node;
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  public constructor(
    elementTypeNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    closeBracketNode: TypeScriptCloseBracketNode | undefined,
    span: SourceSpan,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.elementTypeNode = elementTypeNode;
    this.openBracketNode = openBracketNode;
    this.closeBracketNode = closeBracketNode;
  }
}
