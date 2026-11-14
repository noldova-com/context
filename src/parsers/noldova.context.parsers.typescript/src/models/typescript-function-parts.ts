/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptParameterListNode } from "./nodes/declarations/typescript-parameter-list.node.js";
import type { TypeScriptColonNode } from "./nodes/delimiters/typescript-colon.node.js";
import type { TypeScriptSemicolonNode } from "./nodes/delimiters/typescript-semicolon.node.js";
import type { TypeScriptFunctionKeywordNode } from "./nodes/keywords/typescript-function-keyword.node.js";
import type { TypeScriptAsteriskNode } from "./nodes/operators/typescript-asterisk.node.js";
import type { TypeScriptBlockNode } from "./nodes/statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "./nodes/types/typescript-type-parameter-list.node.js";

export class TypeScriptFunctionParts {
  public readonly functionKeywordNode: TypeScriptFunctionKeywordNode;
  public readonly span: SourceSpan;
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly modifierNodes: readonly Node[];
  public readonly asteriskNode: TypeScriptAsteriskNode | undefined;
  public readonly nameNode: Node | undefined;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly bodyNode: TypeScriptBlockNode | undefined;
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;
  public readonly leadingTrivia: Node | undefined;
  public readonly trailingTrivia: Node | undefined;

  public constructor(
    functionKeywordNode: TypeScriptFunctionKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    modifierNodes: readonly Node[],
    asteriskNode: TypeScriptAsteriskNode | undefined,
    nameNode: Node | undefined,
    typeParameterListNode: TypeScriptTypeParameterListNode | undefined,
    colonNode: TypeScriptColonNode | undefined,
    returnTypeNode: Node | undefined,
    bodyNode: TypeScriptBlockNode | undefined,
    semicolonNode: TypeScriptSemicolonNode | undefined,
    leadingTrivia: Node | undefined,
    trailingTrivia: Node | undefined) {
    this.functionKeywordNode = functionKeywordNode;
    this.span = span;
    this.parameterListNode = parameterListNode;
    this.modifierNodes = modifierNodes;
    this.asteriskNode = asteriskNode;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.bodyNode = bodyNode;
    this.semicolonNode = semicolonNode;
    this.leadingTrivia = leadingTrivia;
    this.trailingTrivia = trailingTrivia;
  }
}
