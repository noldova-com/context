/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompositeNode, type Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import type { TypeScriptInterfaceKeywordNode } from "../keywords/typescript-interface-keyword.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import type { TypeScriptHeritageClauseNode } from "./typescript-heritage-clause.node.js";

export class TypeScriptInterfaceDeclarationNode extends CompositeNode {
  public readonly modifierNodes: readonly Node[];
  public readonly interfaceKeywordNode: TypeScriptInterfaceKeywordNode;
  public readonly nameNode: Node;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;
  public readonly heritageClauseNodes: readonly TypeScriptHeritageClauseNode[];
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  public constructor(
    interfaceKeywordNode: TypeScriptInterfaceKeywordNode,
    memberNodes: readonly Node[],
    heritageClauseNodes: readonly TypeScriptHeritageClauseNode[],
    span: SourceSpan,
    nameNode: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(memberNodes, span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.interfaceKeywordNode = interfaceKeywordNode;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.heritageClauseNodes = heritageClauseNodes;
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
  }
}
