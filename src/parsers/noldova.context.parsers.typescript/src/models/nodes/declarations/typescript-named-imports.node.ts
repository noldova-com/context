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
import { TypeScriptDelimitedListNode } from "../typescript-delimited-list.node.js";
import type { TypeScriptImportSpecifierNode } from "./typescript-import-specifier.node.js";

export class TypeScriptNamedImportsNode extends TypeScriptDelimitedListNode {
  public declare readonly children: readonly TypeScriptImportSpecifierNode[];
  public readonly openBraceNode: TypeScriptOpenBraceNode | undefined;
  public readonly closeBraceNode: TypeScriptCloseBraceNode | undefined;

  public constructor(
    memberNodes: readonly TypeScriptImportSpecifierNode[],
    commaNodes: readonly TypeScriptCommaNode[],
    span: SourceSpan,
    openBraceNode?: TypeScriptOpenBraceNode,
    closeBraceNode?: TypeScriptCloseBraceNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(memberNodes, commaNodes, span, leadingTrivia, trailingTrivia);
    this.openBraceNode = openBraceNode;
    this.closeBraceNode = closeBraceNode;
  }
}
