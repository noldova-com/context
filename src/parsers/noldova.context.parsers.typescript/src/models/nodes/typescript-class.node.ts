/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptClassBodyNode } from "./declarations/typescript-class-body.node.js";
import type { TypeScriptHeritageClauseNode } from "./declarations/typescript-heritage-clause.node.js";
import type { TypeScriptClassKeywordNode } from "./keywords/typescript-class-keyword.node.js";
import type { TypeScriptTypeParameterListNode } from "./types/typescript-type-parameter-list.node.js";

export abstract class TypeScriptClassNode extends Node {
  public readonly modifierNodes: readonly Node[];
  public readonly bodyNode: TypeScriptClassBodyNode;
  public readonly classKeywordNode: TypeScriptClassKeywordNode;
  public readonly heritageClauseNodes: readonly TypeScriptHeritageClauseNode[];
  public readonly nameNode: Node | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;

  public constructor(
    classKeywordNode: TypeScriptClassKeywordNode,
    heritageClauseNodes: readonly TypeScriptHeritageClauseNode[],
    span: SourceSpan,
    bodyNode: TypeScriptClassBodyNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    modifierNodes: readonly Node[] = [],
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.classKeywordNode = classKeywordNode;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.heritageClauseNodes = heritageClauseNodes;
    this.bodyNode = bodyNode;
  }
}
