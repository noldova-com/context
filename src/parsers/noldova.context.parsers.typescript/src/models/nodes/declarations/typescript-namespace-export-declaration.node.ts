/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptAsKeywordNode } from "../keywords/typescript-as-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../keywords/typescript-export-keyword.node.js";
import type { TypeScriptNamespaceKeywordNode } from "../keywords/typescript-namespace-keyword.node.js";

export class TypeScriptNamespaceExportDeclarationNode extends Node {
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;
  public readonly asKeywordNode: TypeScriptAsKeywordNode;
  public readonly namespaceKeywordNode: TypeScriptNamespaceKeywordNode | undefined;
  public readonly nameNode: Node;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    span: SourceSpan,
    asKeywordNode: TypeScriptAsKeywordNode,
    nameNode: Node,
    namespaceKeywordNode?: TypeScriptNamespaceKeywordNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.exportKeywordNode = exportKeywordNode;
    this.asKeywordNode = asKeywordNode;
    this.namespaceKeywordNode = namespaceKeywordNode;
    this.nameNode = nameNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
