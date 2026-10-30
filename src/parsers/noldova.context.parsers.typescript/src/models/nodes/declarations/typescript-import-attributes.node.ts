/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptCloseBraceNode } from "../delimiters/typescript-close-brace.node.js";
import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptCommaNode } from "../delimiters/typescript-comma.node.js";
import type { TypeScriptOpenBraceNode } from "../delimiters/typescript-open-brace.node.js";
import type { TypeScriptAssertKeywordNode } from "../keywords/typescript-assert-keyword.node.js";
import type { TypeScriptWithKeywordNode } from "../keywords/typescript-with-keyword.node.js";
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptImportAttributeNode } from "./typescript-import-attribute.node.js";

export class TypeScriptImportAttributesNode extends TypeScriptDelimitedListNode {
  public declare readonly children: readonly TypeScriptImportAttributeNode[];
  public readonly keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode | undefined;
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;

  public constructor(
    keywordNode: TypeScriptWithKeywordNode | TypeScriptAssertKeywordNode | undefined,
    memberNodes: readonly TypeScriptImportAttributeNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    colonNode?: TypeScriptColonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(memberNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.keywordNode = keywordNode;
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
    this.colonNode = colonNode;
  }
}
