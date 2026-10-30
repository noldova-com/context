/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptGlobalKeywordNode } from "../keywords/typescript-global-keyword.node.js";
import type { TypeScriptModuleKeywordNode } from "../keywords/typescript-module-keyword.node.js";
import type { TypeScriptNamespaceKeywordNode } from "../keywords/typescript-namespace-keyword.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";

export class TypeScriptModuleDeclarationNode extends Node {
  public readonly keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode;
  public readonly nameNode: Node | undefined;
  public readonly bodyNode: TypeScriptBlockNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    keywordNode: TypeScriptModuleKeywordNode | TypeScriptNamespaceKeywordNode | TypeScriptGlobalKeywordNode,
    span: SourceSpan,
    nameNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.keywordNode = keywordNode;
    this.nameNode = nameNode;
    this.bodyNode = bodyNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
