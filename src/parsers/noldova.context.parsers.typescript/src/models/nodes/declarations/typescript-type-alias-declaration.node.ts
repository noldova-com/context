/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptTypeKeywordNode } from "../keywords/typescript-type-keyword.node.js";
import type { TypeScriptEqualsNode } from "../operators/typescript-equals.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";

export class TypeScriptTypeAliasDeclarationNode extends Node {
  public readonly modifierNodes: readonly Node[];
  public readonly equalsNode: TypeScriptEqualsNode | undefined;
  public readonly nameNode: Node;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly typeKeywordNode: TypeScriptTypeKeywordNode;
  public readonly typeNode: Node;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    typeKeywordNode: TypeScriptTypeKeywordNode,
    span: SourceSpan,
    nameNode: Node,
    typeNode: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    equalsNode?: TypeScriptEqualsNode,
    semicolonNode?: TypeScriptSemicolonNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.typeKeywordNode = typeKeywordNode;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.equalsNode = equalsNode;
    this.typeNode = typeNode;
    this.semicolonNode = semicolonNode;
  }
}
