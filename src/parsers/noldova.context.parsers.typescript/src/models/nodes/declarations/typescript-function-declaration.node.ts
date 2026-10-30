/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Node, SourceSpan } from "@noldova/context.parsers";

import type { TypeScriptColonNode } from "../delimiters/typescript-colon.node.js";
import type { TypeScriptSemicolonNode } from "../delimiters/typescript-semicolon.node.js";
import type { TypeScriptFunctionKeywordNode } from "../keywords/typescript-function-keyword.node.js";
import type { TypeScriptAsteriskNode } from "../operators/typescript-asterisk.node.js";
import type { TypeScriptBlockNode } from "../statements/typescript-block.node.js";
import type { TypeScriptTypeParameterListNode } from "../types/typescript-type-parameter-list.node.js";
import { TypeScriptFunctionNode } from "../typescript-function.node.js";
import type { TypeScriptParameterListNode } from "./typescript-parameter-list.node.js";

export class TypeScriptFunctionDeclarationNode extends TypeScriptFunctionNode {
  public readonly semicolonNode: TypeScriptSemicolonNode | undefined;

  public constructor(
    functionKeywordNode: TypeScriptFunctionKeywordNode,
    span: SourceSpan,
    parameterListNode: TypeScriptParameterListNode,
    modifierNodes: readonly Node[] = [],
    asteriskNode?: TypeScriptAsteriskNode,
    nameNode?: Node,
    typeParameterListNode?: TypeScriptTypeParameterListNode,
    colonNode?: TypeScriptColonNode,
    returnTypeNode?: Node,
    bodyNode?: TypeScriptBlockNode,
    semicolonNode?: TypeScriptSemicolonNode,
    leadingTrivia?: Node,
    trailingTrivia?: Node) {
    super(functionKeywordNode, span, parameterListNode, modifierNodes, asteriskNode, nameNode, typeParameterListNode,
      colonNode, returnTypeNode, bodyNode, leadingTrivia, trailingTrivia);
    this.semicolonNode = semicolonNode;
  }
}
