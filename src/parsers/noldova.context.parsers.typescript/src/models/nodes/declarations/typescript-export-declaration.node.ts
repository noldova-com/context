/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptExportKeywordNode } from "../keywords/typescript-export-keyword.node.js";
import type { TypeScriptFromKeywordNode } from "../keywords/typescript-from-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../keywords/typescript-type-keyword.node.js";
import type { TypeScriptImportAttributesNode } from "./typescript-import-attributes.node.js";
import type { TypeScriptNamedExportsNode } from "./typescript-named-exports.node.js";
import type { TypeScriptNamespaceExportNode } from "./typescript-namespace-export.node.js";

export class TypeScriptExportDeclarationNode extends Node {
  public readonly exportKeywordNode: TypeScriptExportKeywordNode;
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;
  public readonly exportClauseNode: TypeScriptNamedExportsNode | TypeScriptNamespaceExportNode;
  public readonly fromKeywordNode: TypeScriptFromKeywordNode | undefined;
  public readonly moduleSpecifierNode: Node | undefined;
  public readonly attributesNode: TypeScriptImportAttributesNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    exportKeywordNode: TypeScriptExportKeywordNode,
    span: SourceSpan,
    exportClauseNode: TypeScriptNamedExportsNode | TypeScriptNamespaceExportNode,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    fromKeywordNode?: TypeScriptFromKeywordNode,
    moduleSpecifierNode?: Node,
    attributesNode?: TypeScriptImportAttributesNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.exportKeywordNode = exportKeywordNode;
    this.typeKeywordNode = typeKeywordNode;
    this.exportClauseNode = exportClauseNode;
    this.fromKeywordNode = fromKeywordNode;
    this.moduleSpecifierNode = moduleSpecifierNode;
    this.attributesNode = attributesNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
