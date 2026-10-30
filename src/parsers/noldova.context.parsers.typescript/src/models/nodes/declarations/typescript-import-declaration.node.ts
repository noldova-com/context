/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptDeferKeywordNode } from "../keywords/typescript-defer-keyword.node.js";
import type { TypeScriptFromKeywordNode } from "../keywords/typescript-from-keyword.node.js";
import type { TypeScriptImportKeywordNode } from "../keywords/typescript-import-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../keywords/typescript-type-keyword.node.js";
import type { TypeScriptImportAttributesNode } from "./typescript-import-attributes.node.js";
import type { TypeScriptImportClauseNode } from "./typescript-import-clause.node.js";

export class TypeScriptImportDeclarationNode extends Node {
  public readonly importKeywordNode: TypeScriptImportKeywordNode;
  public readonly phaseKeywordNode: TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode | undefined;
  public readonly importClauseNode: TypeScriptImportClauseNode | undefined;
  public readonly fromKeywordNode: TypeScriptFromKeywordNode | undefined;
  public readonly moduleSpecifierNode: Node;
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    span: SourceSpan,
    moduleSpecifierNode: Node,
    phaseKeywordNode?: TypeScriptTypeKeywordNode | TypeScriptDeferKeywordNode,
    importClauseNode?: TypeScriptImportClauseNode,
    fromKeywordNode?: TypeScriptFromKeywordNode,
    attributesNode?: TypeScriptImportAttributesNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.importKeywordNode = importKeywordNode;
    this.phaseKeywordNode = phaseKeywordNode;
    this.importClauseNode = importClauseNode;
    this.fromKeywordNode = fromKeywordNode;
    this.moduleSpecifierNode = moduleSpecifierNode;
    this.attributesNode = attributesNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
