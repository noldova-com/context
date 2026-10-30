/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import type { TypeScriptEnumKeywordNode } from "../keywords/typescript-enum-keyword.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptEnumMemberNode } from "./typescript-enum-member.node.js";

export class TypeScriptEnumDeclarationNode extends TypeScriptDelimitedListNode {
  public readonly modifierNodes: readonly Node[];
  public declare readonly children: readonly TypeScriptEnumMemberNode[];
  public readonly enumKeywordNode: TypeScriptEnumKeywordNode;
  public readonly nameNode: Node;
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  public constructor(
    enumKeywordNode: TypeScriptEnumKeywordNode,
    memberNodes: readonly TypeScriptEnumMemberNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    nameNode: Node,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(memberNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.enumKeywordNode = enumKeywordNode;
    this.nameNode = nameNode;
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
  }
}
