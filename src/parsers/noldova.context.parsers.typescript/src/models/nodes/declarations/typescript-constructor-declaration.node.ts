/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SourceSpan } from "@noldova/context.parsers";
import { Node } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptConstructorKeywordNode } from "../keywords/typescript-constructor-keyword.node.js";
import type { TypeScriptStringLiteralNode } from "../literals/typescript-string-literal.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptConstructorDeclarationNode extends Node {
  public readonly bodyNode: TypeScriptBlockNode | undefined;
  public readonly nameNode: TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode;
  public readonly typeParameterListNode: TypeScriptTypeParameterListNode | undefined;
  public readonly colonNode: TypeScriptColonNode | undefined;
  public readonly returnTypeNode: Node | undefined;
  public readonly modifierNodes: readonly Node[];
  public readonly parameterListNode: TypeScriptParameterListNode;
  public readonly terminatorNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    modifierNodes: readonly Node[],
    nameNode: TypeScriptConstructorKeywordNode | TypeScriptStringLiteralNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    bodyNode?: TypeScriptBlockNode,
    terminatorNode?: TypeScriptSemicolonNode,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(span, leadingTrivia, trailingTrivia);
    this.modifierNodes = modifierNodes;
    this.nameNode = nameNode;
    this.typeParameterListNode = typeParameterListNode;
    this.colonNode = colonNode;
    this.returnTypeNode = returnTypeNode;
    this.parameterListNode = parameterListNode;
    this.bodyNode = bodyNode;
    this.terminatorNode = terminatorNode;
  }
}
