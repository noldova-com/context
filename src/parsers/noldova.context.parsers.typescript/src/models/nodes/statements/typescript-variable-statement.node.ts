/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptVariableDeclarationListNode } from "../declarations/typescript-variable-declaration-list.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";

export class TypeScriptVariableStatementNode extends Node {
  public readonly modifierNodes: readonly Node[];
  public readonly declarationListNode: TypeScriptVariableDeclarationListNode;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    declarationListNode: TypeScriptVariableDeclarationListNode,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.declarationListNode = declarationListNode;
    this.semicolonNode = semicolonNode;
  }
}
