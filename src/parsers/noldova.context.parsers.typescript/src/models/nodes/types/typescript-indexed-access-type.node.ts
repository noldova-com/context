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

export class TypeScriptIndexedAccessTypeNode extends Node {
  public readonly closeBracketNode: TypeScriptCloseBracketNode | undefined;
  public readonly indexTypeNode: Node;
  public readonly objectTypeNode: Node;
  public readonly openBracketNode: TypeScriptOpenBracketNode;

  public constructor(
    objectTypeNode: Node,
    openBracketNode: TypeScriptOpenBracketNode,
    span: SourceSpan,
    indexTypeNode: Node,
    closeBracketNode?: TypeScriptCloseBracketNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.objectTypeNode = objectTypeNode;
    this.openBracketNode = openBracketNode;
    this.indexTypeNode = indexTypeNode;
    this.closeBracketNode = closeBracketNode;
  }
}
