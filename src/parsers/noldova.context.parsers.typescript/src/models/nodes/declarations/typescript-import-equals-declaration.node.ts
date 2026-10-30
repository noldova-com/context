/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Node, type SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptImportKeywordNode } from "../keywords/typescript-import-keyword.node.js";
import type { TypeScriptTypeKeywordNode } from "../keywords/typescript-type-keyword.node.js";
import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";

export class TypeScriptImportEqualsDeclarationNode extends Node {
  public readonly importKeywordNode: TypeScriptImportKeywordNode;
  public readonly nameNode: Node;
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly moduleReferenceNode: Node;
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly modifierNodes: readonly Node[];

  public constructor(
    importKeywordNode: TypeScriptImportKeywordNode,
    nameNode: Node,
    span: SourceSpan,
    moduleReferenceNode: Node,
    equalsNode?: TypeScriptEqualsNode,
    typeKeywordNode?: TypeScriptTypeKeywordNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.importKeywordNode = importKeywordNode;
    this.nameNode = nameNode;
    this.equalsNode = equalsNode;
    this.moduleReferenceNode = moduleReferenceNode;
    this.typeKeywordNode = typeKeywordNode;
    this.semicolonNode = semicolonNode;
    this.modifierNodes = modifierNodes;
  }
}
