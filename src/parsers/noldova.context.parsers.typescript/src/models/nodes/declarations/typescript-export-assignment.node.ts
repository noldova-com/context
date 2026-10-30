/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptDefaultKeywordNode } from "../keywords/typescript-default-keyword.node.js";
import type { TypeScriptExportKeywordNode } from "../keywords/typescript-export-keyword.node.js";
import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";

export class TypeScriptExportAssignmentNode extends Node {
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;
  public readonly assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode;
  public readonly expressionNode: Node;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    assignmentTokenNode: TypeScriptDefaultKeywordNode | TypeScriptEqualsNode,
    expressionNode: Node,
    span: SourceSpan,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.exportKeywordNode = exportKeywordNode;
    this.assignmentTokenNode = assignmentTokenNode;
    this.expressionNode = expressionNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
